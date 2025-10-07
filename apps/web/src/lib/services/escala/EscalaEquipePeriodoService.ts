/**
 * Serviço para EscalaEquipePeriodo
 *
 * Gerencia lógica de negócio complexa para escalas, incluindo:
 * - Geração automática de slots
 * - Validação de composição mínima
 * - Publicação e arquivamento
 * - Duplicação de períodos
 */

import {
  EscalaEquipePeriodo,
  SlotEscala,
  StatusEscalaEquipePeriodo,
  TipoEscala,
  EquipeHorarioVigencia,
} from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import { prisma } from '../../db/db.service';
import {
  EscalaEquipePeriodoCreateInput,
  EscalaEquipePeriodoRepository,
  EscalaEquipePeriodoUpdateInput,
} from '../../repositories/escala/EscalaEquipePeriodoRepository';
import {
  escalaEquipePeriodoCreateSchema,
  escalaEquipePeriodoFilterSchema,
  escalaEquipePeriodoUpdateSchema,
  GerarSlotsInput,
  PublicarPeriodoInput,
  DuplicarPeriodoInput,
} from '../../schemas/escalaSchemas';
import { PaginatedResult } from '../../types/common';

type EscalaEquipePeriodoCreate = z.infer<typeof escalaEquipePeriodoCreateSchema>;
type EscalaEquipePeriodoUpdate = z.infer<typeof escalaEquipePeriodoUpdateSchema>;
type EscalaEquipePeriodoFilter = z.infer<typeof escalaEquipePeriodoFilterSchema>;

const DiaSemanaMap = {
  SEGUNDA: 1,
  TERCA: 2,
  QUARTA: 3,
  QUINTA: 4,
  SEXTA: 5,
  SABADO: 6,
  DOMINGO: 0,
};

export class EscalaEquipePeriodoService extends AbstractCrudService<
  EscalaEquipePeriodoCreate,
  EscalaEquipePeriodoUpdate,
  EscalaEquipePeriodoFilter,
  EscalaEquipePeriodo
> {
  private escalaRepo: EscalaEquipePeriodoRepository;

  constructor() {
    const repo = new EscalaEquipePeriodoRepository();
    super(repo);
    this.escalaRepo = repo;
  }

  async create(
    data: EscalaEquipePeriodoCreate,
    userId: string
  ): Promise<EscalaEquipePeriodo> {
    // Validar se não há sobreposição de períodos
    const sobreposicao = await this.escalaRepo.findByEquipeAndPeriodo(
      data.equipeId,
      data.periodoInicio,
      data.periodoFim
    );

    if (sobreposicao.length > 0) {
      throw new Error('Já existe uma escala para esta equipe neste período');
    }

    const createData: EscalaEquipePeriodoCreateInput = {
      equipeId: data.equipeId,
      periodoInicio: data.periodoInicio,
      periodoFim: data.periodoFim,
      tipoEscalaId: data.tipoEscalaId,
      observacoes: data.observacoes,
    };

    return this.escalaRepo.create(createData, userId);
  }

  async update(
    data: EscalaEquipePeriodoUpdate,
    userId: string
  ): Promise<EscalaEquipePeriodo> {
    const periodo = await this.escalaRepo.findById(data.id);
    if (!periodo) {
      throw new Error('Escala não encontrada');
    }

    // Não permitir edição de escalas publicadas
    if (periodo.status === 'PUBLICADA' && data.status !== 'ARQUIVADA') {
      throw new Error('Não é possível editar escalas publicadas. Arquive primeiro.');
    }

    const updateInput: EscalaEquipePeriodoUpdateInput = {
      id: data.id,
      ...data,
    };

    return this.escalaRepo.update(updateInput, userId);
  }

  async list(params: EscalaEquipePeriodoFilter): Promise<PaginatedResult<EscalaEquipePeriodo>> {
    const { items, total } = await this.escalaRepo.list(params);
    return {
      data: items,
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  /**
   * Gera slots de escala baseado no tipo configurado
   */
  async gerarSlots(input: GerarSlotsInput, userId: string): Promise<{ slotsGerados: number }> {
    const periodo = await this.escalaRepo.findById(input.escalaEquipePeriodoId);
    if (!periodo) {
      throw new Error('Período de escala não encontrado');
    }

    if (periodo.status === 'PUBLICADA') {
      throw new Error('Não é possível gerar slots em escalas publicadas');
    }

    const tipoEscala = await prisma.tipoEscala.findUnique({
      where: { id: periodo.tipoEscalaId },
      include: {
        CicloPosicoes: { orderBy: { posicao: 'asc' } },
        SemanaMascaras: true,
      },
    });

    if (!tipoEscala) {
      throw new Error('Tipo de escala não encontrado');
    }

    // Buscar horário vigente da equipe
    const horarioVigente = await this.buscarHorarioVigente(
      periodo.equipeId,
      periodo.periodoInicio
    );

    const dataInicio = input.mode === 'fromDate' ? input.fromDate! : periodo.periodoInicio;
    const dataFim = periodo.periodoFim;

    const slots: Array<Omit<SlotEscala, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy' | 'deletedAt' | 'deletedBy'>> = [];
    let currentDate = new Date(dataInicio);

    while (currentDate <= dataFim) {
      const estado = this.determinarEstado(currentDate, tipoEscala, periodo.periodoInicio);

      let inicioPrevisto: string | null = null;
      let fimPrevisto: string | null = null;

      if (estado === 'TRABALHO' && horarioVigente) {
        inicioPrevisto = horarioVigente.inicioTurnoHora;
        fimPrevisto = this.calcularFimTurno(
          horarioVigente.inicioTurnoHora,
          Number(horarioVigente.duracaoHoras)
        );
      }

      slots.push({
        escalaEquipePeriodoId: periodo.id,
        data: new Date(currentDate),
        estado,
        inicioPrevisto,
        fimPrevisto,
        anotacoesDia: null,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Upsert slots no banco
    await prisma.$transaction(
      slots.map(slot =>
        prisma.slotEscala.upsert({
          where: {
            escalaEquipePeriodoId_data: {
              escalaEquipePeriodoId: slot.escalaEquipePeriodoId,
              data: slot.data,
            },
          },
          create: {
            ...slot,
            createdBy: userId,
            createdAt: new Date(),
          },
          update: {
            estado: slot.estado,
            inicioPrevisto: slot.inicioPrevisto,
            fimPrevisto: slot.fimPrevisto,
            updatedBy: userId,
            updatedAt: new Date(),
          },
        })
      )
    );

    return { slotsGerados: slots.length };
  }

  /**
   * Determina o estado (TRABALHO/FOLGA) baseado no tipo de escala
   */
  private determinarEstado(
    data: Date,
    tipoEscala: TipoEscala & {
      CicloPosicoes: Array<{ posicao: number; status: string }>;
      SemanaMascaras: Array<{ semanaIndex: number; dia: string; status: string }>;
    },
    dataInicio: Date
  ): 'TRABALHO' | 'FOLGA' | 'BLOQUEADO_CALENDARIO' | 'EXCECAO' {
    if (tipoEscala.modoRepeticao === 'CICLO_DIAS') {
      const diffDays = Math.floor((data.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
      const posicao = diffDays % tipoEscala.cicloDias!;
      const cicloPosicao = tipoEscala.CicloPosicoes.find(cp => cp.posicao === posicao);
      return cicloPosicao?.status === 'TRABALHO' ? 'TRABALHO' : 'FOLGA';
    }

    if (tipoEscala.modoRepeticao === 'SEMANA_DEPENDENTE') {
      const diffWeeks = Math.floor((data.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24 * 7));
      const semanaIndex = diffWeeks % tipoEscala.periodicidadeSemanas!;
      const diaSemana = data.getDay(); // 0=Domingo, 1=Segunda, ...

      const diaNome = Object.keys(DiaSemanaMap).find(
        key => DiaSemanaMap[key as keyof typeof DiaSemanaMap] === diaSemana
      );

      const mascara = tipoEscala.SemanaMascaras.find(
        sm => sm.semanaIndex === semanaIndex && sm.dia === diaNome
      );

      return mascara?.status === 'TRABALHO' ? 'TRABALHO' : 'FOLGA';
    }

    return 'FOLGA';
  }

  /**
   * Busca horário vigente da equipe para uma data
   */
  private async buscarHorarioVigente(
    equipeId: number,
    data: Date
  ): Promise<EquipeHorarioVigencia | null> {
    return prisma.equipeHorarioVigencia.findFirst({
      where: {
        equipeId,
        vigenciaInicio: { lte: data },
        OR: [
          { vigenciaFim: null },
          { vigenciaFim: { gte: data } },
        ],
        deletedAt: null,
      },
      orderBy: { vigenciaInicio: 'desc' },
    });
  }

  /**
   * Calcula horário de fim do turno
   */
  private calcularFimTurno(inicioHora: string, duracaoHoras: number): string {
    const [h, m, s] = inicioHora.split(':').map(Number);
    const inicioMinutos = h * 60 + m;
    const fimMinutos = inicioMinutos + duracaoHoras * 60;

    const fimH = Math.floor(fimMinutos / 60) % 24;
    const fimM = fimMinutos % 60;

    return `${String(fimH).padStart(2, '0')}:${String(fimM).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  /**
   * Publica uma escala (torna imutável)
   */
  async publicar(input: PublicarPeriodoInput, userId: string): Promise<EscalaEquipePeriodo> {
    const periodo = await this.escalaRepo.findById(input.escalaEquipePeriodoId);
    if (!periodo) {
      throw new Error('Período não encontrado');
    }

    if (periodo.status === 'PUBLICADA') {
      throw new Error('Período já está publicado');
    }

    // Validar composição mínima se solicitado
    if (input.validarComposicao) {
      await this.validarComposicaoMinima(periodo.id);
    }

    return this.escalaRepo.updateStatus(periodo.id, 'PUBLICADA', userId);
  }

  /**
   * Arquiva uma escala
   */
  async arquivar(periodoId: number, userId: string): Promise<EscalaEquipePeriodo> {
    return this.escalaRepo.updateStatus(periodoId, 'ARQUIVADA', userId);
  }

  /**
   * Duplica um período de escala
   */
  async duplicar(input: DuplicarPeriodoInput, userId: string): Promise<EscalaEquipePeriodo> {
    const periodoOrigem = await this.escalaRepo.findById(input.escalaEquipePeriodoId);
    if (!periodoOrigem) {
      throw new Error('Período origem não encontrado');
    }

    // Criar novo período
    const novoPeriodo = await this.create(
      {
        equipeId: periodoOrigem.equipeId,
        periodoInicio: input.novoPeriodoInicio,
        periodoFim: input.novoPeriodoFim,
        tipoEscalaId: periodoOrigem.tipoEscalaId,
        observacoes: `Duplicado de período ${periodoOrigem.id}`,
      },
      userId
    );

    // Gerar slots
    await this.gerarSlots(
      {
        escalaEquipePeriodoId: novoPeriodo.id,
        mode: 'full',
      },
      userId
    );

    // Copiar atribuições se solicitado
    if (input.copiarAtribuicoes) {
      // TODO: Implementar cópia de atribuições
    }

    return novoPeriodo;
  }

  /**
   * Valida composição mínima de todos os slots de trabalho
   */
  private async validarComposicaoMinima(periodoId: number): Promise<void> {
    const slots = await prisma.slotEscala.findMany({
      where: {
        escalaEquipePeriodoId: periodoId,
        estado: 'TRABALHO',
        deletedAt: null,
      },
      include: {
        Atribuicoes: {
          where: {
            statusPlanejado: 'ATIVO',
            deletedAt: null,
          },
          include: {
            papel: true,
          },
        },
      },
    });

    const periodo = await this.escalaRepo.findById(periodoId);
    if (!periodo) {
      throw new Error('Período não encontrado');
    }

    // TODO: Implementar validação completa de composição
    // (verificar override, tipo, e equipe)

    for (const slot of slots) {
      if (slot.Atribuicoes.length === 0) {
        throw new Error(`Slot de ${slot.data.toLocaleDateString()} não tem atribuições`);
      }
    }
  }
}

