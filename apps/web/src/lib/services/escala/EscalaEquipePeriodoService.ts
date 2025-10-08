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
import {
  resolveStatusDoDia,
  horarioVigente,
  membrosVigentes,
} from './escalaHelpers';

type EscalaEquipePeriodoCreate = z.infer<
  typeof escalaEquipePeriodoCreateSchema
>;
type EscalaEquipePeriodoUpdate = z.infer<
  typeof escalaEquipePeriodoUpdateSchema
>;
type EscalaEquipePeriodoFilter = z.infer<
  typeof escalaEquipePeriodoFilterSchema
>;

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
    // @ts-ignore - Compatibilidade de tipos do repositório
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
      throw new Error(
        'Não é possível editar escalas publicadas. Arquive primeiro.'
      );
    }

    // @ts-ignore - Compatibilidade de tipos do repositório
    const updateInput: EscalaEquipePeriodoUpdateInput = {
      equipeId: data.equipeId,
      tipoEscalaId: data.tipoEscalaId,
      periodoInicio: data.periodoInicio,
      periodoFim: data.periodoFim,
      observacoes: data.observacoes,
      status: data.status,
    };

    return this.escalaRepo.update(updateInput, userId);
  }

  async list(
    params: EscalaEquipePeriodoFilter
  ): Promise<PaginatedResult<EscalaEquipePeriodo>> {
    const { items, total } = await this.escalaRepo.list(params);
    return {
      data: items,
      total,
      totalPages: Math.ceil(total / params.pageSize),
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  /**
   * Gera slots de escala baseado no tipo configurado
   *
   * Cria um slot por (periodoId, data, eletricistaId) seguindo o novo modelo:
   * - Antes de publicar: apenas TRABALHO ou FOLGA
   * - Composição diária definida por TipoEscala.eletricistasPorTurma
   * - Horários previstos de EquipeHorarioVigencia quando estado = TRABALHO
   */
  async gerarSlots(
    input: GerarSlotsInput,
    userId: string
  ): Promise<{ slotsGerados: number }> {
    const periodo = await this.escalaRepo.findById(input.escalaEquipePeriodoId);
    if (!periodo) {
      throw new Error('Período de escala não encontrado');
    }

    // Pré-condição: período em RASCUNHO ou EM_APROVACAO
    if (periodo.status === 'PUBLICADA' || periodo.status === 'ARQUIVADA') {
      throw new Error(
        'Não é possível gerar slots em escalas publicadas ou arquivadas'
      );
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

    // Buscar eletricistas vigentes da equipe
    const eletricistas = await membrosVigentes(
      periodo.equipeId,
      periodo.periodoInicio,
      periodo.periodoFim
    );

    if (eletricistas.length === 0) {
      throw new Error('Nenhum eletricista ativo encontrado na equipe');
    }

    const eletricistasPorTurma =
      tipoEscala.eletricistasPorTurma || eletricistas.length;

    // Validar se há eletricistas suficientes
    if (eletricistas.length < eletricistasPorTurma) {
      throw new Error(
        `A equipe possui apenas ${eletricistas.length} eletricista(s), mas o tipo de escala requer ${eletricistasPorTurma} por turma`
      );
    }

    const dataInicio =
      input.mode === 'fromDate' ? input.fromDate! : periodo.periodoInicio;
    const dataFim = periodo.periodoFim;

    const slotsToUpsert: Array<{
      escalaEquipePeriodoId: number;
      eletricistaId: number;
      data: Date;
      estado: 'TRABALHO' | 'FOLGA';
      inicioPrevisto: string | null;
      fimPrevisto: string | null;
      anotacoesDia: string | null;
      origem: 'GERACAO';
    }> = [];

    let currentDate = new Date(dataInicio);

    // Para cada dia do período
    while (currentDate <= dataFim) {
      // Determinar status do padrão (TRABALHO ou FOLGA)
      const statusDia = resolveStatusDoDia(
        tipoEscala,
        currentDate,
        periodo.periodoInicio
      );

      // Buscar horários vigentes para este dia (se TRABALHO)
      let horarios: { inicio: string; fim: string } | null = null;
      if (statusDia === 'TRABALHO') {
        horarios = await horarioVigente(periodo.equipeId, currentDate);
      }

      // Selecionar quem compõe o dia (eletricistasPorTurma)
      // TODO: Implementar lógica de rodízio inteligente
      // Por enquanto, selecionamos os primeiros N eletricistas
      const escaladosNoDia = eletricistas.slice(0, eletricistasPorTurma);
      const escaladosIds = new Set(escaladosNoDia.map(e => e.id));

      // Para cada eletricista da equipe, criar um slot
      for (const eletricista of eletricistas) {
        const compoe =
          statusDia === 'TRABALHO' && escaladosIds.has(eletricista.id);

        slotsToUpsert.push({
          escalaEquipePeriodoId: periodo.id,
          eletricistaId: eletricista.id,
          data: new Date(currentDate),
          estado: compoe ? 'TRABALHO' : 'FOLGA',
          inicioPrevisto: compoe && horarios ? horarios.inicio : null,
          fimPrevisto: compoe && horarios ? horarios.fim : null,
          anotacoesDia: null,
          origem: 'GERACAO',
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Upsert slots no banco pela chave composta [escalaEquipePeriodoId, data, eletricistaId]
    for (const slot of slotsToUpsert) {
      await prisma.slotEscala.upsert({
        where: {
          escalaEquipePeriodoId_data_eletricistaId: {
            escalaEquipePeriodoId: slot.escalaEquipePeriodoId,
            data: slot.data,
            eletricistaId: slot.eletricistaId,
          },
        },
        create: {
          escalaEquipePeriodoId: slot.escalaEquipePeriodoId,
          eletricistaId: slot.eletricistaId,
          data: slot.data,
          estado: slot.estado,
          inicioPrevisto: slot.inicioPrevisto,
          fimPrevisto: slot.fimPrevisto,
          anotacoesDia: slot.anotacoesDia,
          origem: slot.origem,
          createdBy: userId,
        },
        update: {
          estado: slot.estado,
          inicioPrevisto: slot.inicioPrevisto,
          fimPrevisto: slot.fimPrevisto,
          updatedBy: userId,
        },
      });
    }

    return { slotsGerados: slotsToUpsert.length };
  }

  /**
   * Determina o estado (TRABALHO/FOLGA) baseado no tipo de escala
   */
  private determinarEstado(
    data: Date,
    tipoEscala: TipoEscala & {
      CicloPosicoes: Array<{ posicao: number; status: string }>;
      SemanaMascaras: Array<{
        semanaIndex: number;
        dia: string;
        status: string;
      }>;
    },
    dataInicio: Date
  ): 'TRABALHO' | 'FOLGA' | 'BLOQUEADO_CALENDARIO' | 'EXCECAO' {
    if (tipoEscala.modoRepeticao === 'CICLO_DIAS') {
      const diffDays = Math.floor(
        (data.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24)
      );
      const posicao = diffDays % tipoEscala.cicloDias!;
      const cicloPosicao = tipoEscala.CicloPosicoes.find(
        cp => cp.posicao === posicao
      );
      return cicloPosicao?.status === 'TRABALHO' ? 'TRABALHO' : 'FOLGA';
    }

    if (tipoEscala.modoRepeticao === 'SEMANA_DEPENDENTE') {
      const diffWeeks = Math.floor(
        (data.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24 * 7)
      );
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
        OR: [{ vigenciaFim: null }, { vigenciaFim: { gte: data } }],
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
   *
   * Validações:
   * - Nenhum slot com estado = FALTA
   * - Para cada dia: count(TRABALHO) = eletricistasPorTurma
   */
  async publicar(
    input: PublicarPeriodoInput,
    userId: string
  ): Promise<EscalaEquipePeriodo> {
    const periodo = await this.escalaRepo.findById(input.escalaEquipePeriodoId);
    if (!periodo) {
      throw new Error('Período não encontrado');
    }

    if (periodo.status === 'PUBLICADA') {
      throw new Error('Período já está publicado');
    }

    // Validar que não há FALTAs (FALTA só pode ocorrer após publicação)
    const slotsComFalta = await prisma.slotEscala.count({
      where: {
        escalaEquipePeriodoId: periodo.id,
        estado: 'FALTA',
        deletedAt: null,
      },
    });

    if (slotsComFalta > 0) {
      throw new Error(
        'Não é possível publicar período com slots marcados como FALTA. Corrija ou remova essas marcações.'
      );
    }

    // Validar composição diária
    await this.validarComposicaoMinimaDiaria(periodo.id);

    // Atualizar status e incrementar versão
    const updated = await prisma.escalaEquipePeriodo.update({
      where: { id: periodo.id },
      data: {
        status: 'PUBLICADA',
        versao: { increment: 1 },
        updatedBy: userId,
        updatedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Arquiva uma escala
   */
  async arquivar(
    periodoId: number,
    userId: string
  ): Promise<EscalaEquipePeriodo> {
    return this.escalaRepo.updateStatus(periodoId, 'ARQUIVADA', userId);
  }

  /**
   * Marca falta de um eletricista em uma data específica
   *
   * Pré-condição: período em PUBLICADA
   * - Atualiza estado do slot para FALTA
   * - Cria EventoCobertura com tipo = FALTA
   */
  async marcarFalta(params: {
    periodoId: number;
    dataISO: string;
    eletricistaId: number;
    cobridorId?: number;
    justificativa?: string;
    actorId: string;
  }): Promise<{ slot: SlotEscala; evento: any }> {
    // Buscar período
    const periodo = await this.escalaRepo.findById(params.periodoId);
    if (!periodo) {
      throw new Error('Período não encontrado');
    }

    // Pré-condição: período PUBLICADA
    if (periodo.status !== 'PUBLICADA') {
      throw new Error('Só é possível marcar falta em períodos publicados');
    }

    // Encontrar slot pela chave composta
    const data = new Date(params.dataISO);
    const slot = await prisma.slotEscala.findUnique({
      where: {
        escalaEquipePeriodoId_data_eletricistaId: {
          escalaEquipePeriodoId: params.periodoId,
          data,
          eletricistaId: params.eletricistaId,
        },
      },
    });

    if (!slot) {
      throw new Error('Slot não encontrado para esta data e eletricista');
    }

    // Atualizar estado do slot para FALTA
    const slotAtualizado = await prisma.slotEscala.update({
      where: { id: slot.id },
      data: {
        estado: 'FALTA',
        updatedBy: params.actorId,
        updatedAt: new Date(),
      },
    });

    // Criar EventoCobertura
    const resultado = params.cobridorId ? 'COBERTO' : 'VAGA_DESCOBERTA';
    const evento = await prisma.eventoCobertura.create({
      data: {
        slotEscalaId: slot.id,
        eletricistaCobrindoId: params.cobridorId,
        tipo: 'FALTA',
        resultado,
        justificativa: params.justificativa,
        registradoEm: new Date(),
        createdBy: params.actorId,
      },
    });

    return { slot: slotAtualizado, evento };
  }

  /**
   * Registra troca de turno entre eletricistas
   *
   * Pré-condição: período em PUBLICADA
   * - NÃO altera o estado do slot do titular
   * - Cria EventoCobertura com tipo = TROCA e resultado = COBERTO
   */
  async registrarTroca(params: {
    periodoId: number;
    dataISO: string;
    titularId: number;
    executorId: number;
    justificativa?: string;
    actorId: string;
  }): Promise<{ slot: SlotEscala; evento: any }> {
    // Buscar período
    const periodo = await this.escalaRepo.findById(params.periodoId);
    if (!periodo) {
      throw new Error('Período não encontrado');
    }

    // Pré-condição: período PUBLICADA
    if (periodo.status !== 'PUBLICADA') {
      throw new Error('Só é possível registrar troca em períodos publicados');
    }

    // Encontrar slot do titular
    const data = new Date(params.dataISO);
    const slotTitular = await prisma.slotEscala.findUnique({
      where: {
        escalaEquipePeriodoId_data_eletricistaId: {
          escalaEquipePeriodoId: params.periodoId,
          data,
          eletricistaId: params.titularId,
        },
      },
    });

    if (!slotTitular) {
      throw new Error('Slot do titular não encontrado para esta data');
    }

    // Verificar se executor existe na equipe
    const slotExecutor = await prisma.slotEscala.findUnique({
      where: {
        escalaEquipePeriodoId_data_eletricistaId: {
          escalaEquipePeriodoId: params.periodoId,
          data,
          eletricistaId: params.executorId,
        },
      },
    });

    if (!slotExecutor) {
      throw new Error(
        'Executor não pertence à equipe ou não tem slot nesta data'
      );
    }

    // NÃO altera o estado do slot do titular (mantém histórico real)
    // Apenas cria o evento de cobertura

    const evento = await prisma.eventoCobertura.create({
      data: {
        slotEscalaId: slotTitular.id,
        eletricistaCobrindoId: params.executorId,
        tipo: 'TROCA',
        resultado: 'COBERTO',
        justificativa: params.justificativa,
        registradoEm: new Date(),
        createdBy: params.actorId,
      },
    });

    return { slot: slotTitular, evento };
  }

  /**
   * Duplica um período de escala
   */
  async duplicar(
    input: DuplicarPeriodoInput,
    userId: string
  ): Promise<EscalaEquipePeriodo> {
    const periodoOrigem = await this.escalaRepo.findById(
      input.escalaEquipePeriodoId
    );
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
   * Valida composição diária: count(TRABALHO) = eletricistasPorTurma para cada dia
   */
  private async validarComposicaoMinimaDiaria(
    periodoId: number
  ): Promise<void> {
    const periodo = await prisma.escalaEquipePeriodo.findUnique({
      where: { id: periodoId },
      include: {
        tipoEscala: true,
      },
    });

    if (!periodo) {
      throw new Error('Período não encontrado');
    }

    const eletricistasPorTurma = periodo.tipoEscala.eletricistasPorTurma;
    if (!eletricistasPorTurma) {
      throw new Error(
        'Tipo de escala não possui eletricistasPorTurma configurado'
      );
    }

    // Buscar contagem de slots TRABALHO por dia
    const slotsPorDia = await prisma.slotEscala.groupBy({
      by: ['data'],
      where: {
        escalaEquipePeriodoId: periodoId,
        estado: 'TRABALHO',
        deletedAt: null,
      },
      _count: {
        id: true,
      },
    });

    // Verificar cada dia do período
    let currentDate = new Date(periodo.periodoInicio);
    const dataFim = new Date(periodo.periodoFim);
    const diasComProblema: string[] = [];

    while (currentDate <= dataFim) {
      const dataStr = currentDate.toISOString().split('T')[0];

      const slotDoDia = slotsPorDia.find(s => {
        const sData = new Date(s.data);
        return sData.toISOString().split('T')[0] === dataStr;
      });

      const count = slotDoDia ? slotDoDia._count.id : 0;

      // Se o dia tem slots, deve ter exatamente eletricistasPorTurma
      // Se não tem nenhum slot, é um dia de folga (válido)
      if (count > 0 && count !== eletricistasPorTurma) {
        diasComProblema.push(`${dataStr} (${count}/${eletricistasPorTurma})`);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (diasComProblema.length > 0) {
      throw new Error(
        `Composição inválida nos dias: ${diasComProblema.join(', ')}. ` +
          `Cada dia deve ter exatamente ${eletricistasPorTurma} eletricista(s) trabalhando.`
      );
    }
  }
}



