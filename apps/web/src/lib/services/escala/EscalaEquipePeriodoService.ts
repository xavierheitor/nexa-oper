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
import { horarioVigente, membrosVigentes } from './escalaHelpers';

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
    // @ts-expect-error - Diferenças sutis entre tipos de input (null vs undefined) são tratadas no runtime
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
      observacoes: data.observacoes ?? undefined,
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

    // ❌ BLOQUEIA edição de escalas publicadas (exceto via prolongar)
    // Escalas publicadas só podem ser prolongadas ou arquivadas
    if (periodo.status === 'PUBLICADA') {
      throw new Error('Não é possível editar escalas publicadas. Use a opção "Prolongar" para estender o período.');
    }

    const { id, ...updateData } = data;
    const updateInput = {
      equipeId: updateData.equipeId,
      tipoEscalaId: updateData.tipoEscalaId,
      periodoInicio: updateData.periodoInicio,
      periodoFim: updateData.periodoFim,
      observacoes: updateData.observacoes ?? undefined,
      status: updateData.status,
    } as Partial<EscalaEquipePeriodoUpdateInput>;

    return this.escalaRepo.update(id, updateInput, userId);
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
    let eletricistasParaGerar: Array<{ id: number; primeiroDiaFolga: number }> =
      [];

    if (input.eletricistasConfig && input.eletricistasConfig.length > 0) {
      // Usar configuração fornecida pelo wizard
      eletricistasParaGerar = input.eletricistasConfig.map(config => ({
        id: config.eletricistaId,
        primeiroDiaFolga: config.primeiroDiaFolga,
      }));
    } else {
      // Buscar todos os eletricistas vigentes da equipe
      const eletricistasVigentes = await membrosVigentes(
        periodo.equipeId,
        periodo.periodoInicio,
        periodo.periodoFim
      );

      if (eletricistasVigentes.length === 0) {
        throw new Error('Nenhum eletricista ativo encontrado na equipe');
      }

      // Todos começam com primeira folga no dia 0 (compatibilidade)
      eletricistasParaGerar = eletricistasVigentes.map(e => ({
        id: e.id,
        primeiroDiaFolga: 0,
      }));
    }

    if (eletricistasParaGerar.length === 0) {
      throw new Error('Nenhum eletricista selecionado para a escala');
    }

    // ✅ CORREÇÃO: Permitir flexibilidade na quantidade de eletricistas
    // O eletricistasPorTurma do tipo de escala é apenas uma referência,
    // mas permite usar menos eletricistas se necessário (ex: 4x2 com 2 ao invés de 3)
    // const eletricistasPorTurma =
    //   tipoEscala.eletricistasPorTurma || eletricistasParaGerar.length;

    // Validar apenas se não houver nenhum eletricista selecionado
    // A quantidade mínima será determinada pela quantidade selecionada
    if (eletricistasParaGerar.length === 0) {
      throw new Error('Nenhum eletricista selecionado para a escala');
    }

    // Aviso (não erro) se usar menos eletricistas que o recomendado
    if (
      tipoEscala.eletricistasPorTurma &&
      eletricistasParaGerar.length < tipoEscala.eletricistasPorTurma
    ) {
      // Apenas log, não bloqueia - permite flexibilidade
      console.warn(
        `Aviso: Tipo de escala "${tipoEscala.nome}" recomenda ${tipoEscala.eletricistasPorTurma} eletricista(s), mas foram selecionados ${eletricistasParaGerar.length}. A escala será gerada com a quantidade selecionada.`
      );
    }

    // Determina data de início baseado no modo E no status da escala
    let dataInicio: Date;
    if (input.mode === 'fromDate' && input.fromDate) {
      dataInicio = input.fromDate;
    } else if ((periodo.status as string) === 'PUBLICADA') {
      // ✅ PROTEÇÃO: Se publicada, não altera dias passados
      // Apenas gera/atualiza slots a partir de hoje
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      dataInicio =
        hoje > new Date(periodo.periodoInicio)
          ? hoje
          : new Date(periodo.periodoInicio);
    } else {
      dataInicio = new Date(periodo.periodoInicio);
    }

    // ✅ CORREÇÃO: Recarregar período para garantir que periodoFim está atualizado
    // Isso é importante ao prolongar, pois o período foi atualizado antes de chamar gerarSlots
    const periodoAtualizado = await this.escalaRepo.findById(
      input.escalaEquipePeriodoId
    );
    if (!periodoAtualizado) {
      throw new Error('Período não encontrado após atualização');
    }
    const dataFim = periodoAtualizado.periodoFim;

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

    // ✅ CORREÇÃO: Ao prolongar CICLO_DIAS, buscar último slot e continuar o ciclo a partir dele
    // Para SEMANA_DEPENDENTE, não precisa fazer nada especial (usa semanaIndex baseado em semanas)
    const ultimoSlotPorEletricista: Map<
      number,
      { data: Date; estado: 'TRABALHO' | 'FOLGA'; posicaoNoCiclo: number }
    > = new Map();
    const posicaoInicialPorEletricista: Map<number, number> = new Map();

    // Definir periodoInicio para uso em todo o método
    const periodoInicio = new Date(periodo.periodoInicio);
    periodoInicio.setHours(0, 0, 0, 0);

    if (
      input.mode === 'fromDate' &&
      input.fromDate &&
      tipoEscala.modoRepeticao === 'CICLO_DIAS'
    ) {
      // Buscar último slot de cada eletricista (para calcular posição atual no ciclo)
      const dataAntesNovosSlots = new Date(input.fromDate);
      dataAntesNovosSlots.setDate(dataAntesNovosSlots.getDate() - 1);
      dataAntesNovosSlots.setHours(23, 59, 59, 999);

      const cicloDias = tipoEscala.cicloDias || 1;

      // Buscar último slot de cada eletricista
      const ultimosSlots = await prisma.slotEscala.findMany({
        where: {
          escalaEquipePeriodoId: input.escalaEquipePeriodoId,
          eletricistaId: { in: eletricistasParaGerar.map(e => e.id) },
          data: { lte: dataAntesNovosSlots },
          deletedAt: null,
        },
        orderBy: [{ eletricistaId: 'asc' }, { data: 'desc' }],
      });

      // Buscar primeiro slot de folga de cada eletricista para recalcular posicaoInicial
      const primeirosSlotsFolga = await prisma.slotEscala.findMany({
        where: {
          escalaEquipePeriodoId: input.escalaEquipePeriodoId,
          eletricistaId: { in: eletricistasParaGerar.map(e => e.id) },
          estado: 'FOLGA',
          deletedAt: null,
        },
        orderBy: [{ eletricistaId: 'asc' }, { data: 'asc' }],
      });

      // Encontrar a primeira posição de FOLGA no ciclo
      const primeiraFolga = tipoEscala.CicloPosicoes.filter(
        p => p.status === 'FOLGA'
      ).sort((a, b) => a.posicao - b.posicao)[0];

      // Calcular posicaoInicial para cada eletricista baseado no primeiro slot de folga
      const slotsFolgaPorEletricista = new Map<number, Date>();
      for (const slot of primeirosSlotsFolga) {
        if (!slotsFolgaPorEletricista.has(slot.eletricistaId)) {
          slotsFolgaPorEletricista.set(slot.eletricistaId, slot.data);
        }
      }

      // Calcular posicaoInicial para cada eletricista
      for (const eletricistaId of eletricistasParaGerar.map(e => e.id)) {
        if (slotsFolgaPorEletricista.has(eletricistaId) && primeiraFolga) {
          const dataPrimeiraFolga = new Date(
            slotsFolgaPorEletricista.get(eletricistaId)!
          );
          dataPrimeiraFolga.setHours(0, 0, 0, 0);
          const diffMsPrimeiraFolga =
            dataPrimeiraFolga.getTime() - periodoInicio.getTime();
          const primeiroDiaFolga = Math.floor(
            diffMsPrimeiraFolga / (1000 * 60 * 60 * 24)
          );

          // Calcular posicaoInicial como na criação inicial
          const posicaoInicial =
            (primeiraFolga.posicao - primeiroDiaFolga + cicloDias) % cicloDias;
          posicaoInicialPorEletricista.set(eletricistaId, posicaoInicial);
        }
      }

      // Agrupar por eletricistaId, pegando o mais recente e calculando sua posição no ciclo
      for (const slot of ultimosSlots) {
        if (!ultimoSlotPorEletricista.has(slot.eletricistaId)) {
          // Calcular qual posição no ciclo esse slot estava
          const dataSlot = new Date(slot.data);
          dataSlot.setHours(0, 0, 0, 0);
          const diffMs = dataSlot.getTime() - periodoInicio.getTime();
          const diaIndex = Math.floor(diffMs / (1000 * 60 * 60 * 24));

          // ✅ CORREÇÃO: Usar posicaoInicial calculada a partir do primeiro slot de folga
          const posicaoInicial =
            posicaoInicialPorEletricista.get(slot.eletricistaId) || 0;
          // Posição no ciclo (0-indexed): 0..(cicloDias-1) para corresponder ao banco
          const posicaoNoCiclo = (posicaoInicial + diaIndex) % cicloDias;

          ultimoSlotPorEletricista.set(slot.eletricistaId, {
            data: slot.data,
            estado: slot.estado as 'TRABALHO' | 'FOLGA',
            posicaoNoCiclo,
          });
        }
      }
    }

    // Pré-calcular posições iniciais no ciclo para cada eletricista
    // periodoInicio já foi definido acima
    const eletricistasComPosicao = eletricistasParaGerar.map(
      eletricistaConfig => {
        let posicaoInicial = 0;

        if (tipoEscala.modoRepeticao === 'CICLO_DIAS') {
          const cicloDias = tipoEscala.cicloDias || 1;

          // ✅ CORREÇÃO: Ao prolongar CICLO_DIAS, usar posicaoInicial já calculada a partir do primeiro slot de folga
          // Isso garante que cada eletricista continue seu ciclo individual corretamente
          if (input.mode === 'fromDate') {
            // Usar a posicaoInicial que foi calculada a partir do primeiro slot de folga
            if (posicaoInicialPorEletricista.has(eletricistaConfig.id)) {
              posicaoInicial = posicaoInicialPorEletricista.get(
                eletricistaConfig.id
              )!;
            } else {
              // Fallback: se não encontrou primeiro slot de folga, usar cálculo normal baseado em primeiroDiaFolga
              const primeiraFolga = tipoEscala.CicloPosicoes.filter(
                p => p.status === 'FOLGA'
              ).sort((a, b) => a.posicao - b.posicao)[0];

              if (primeiraFolga) {
                posicaoInicial =
                  (primeiraFolga.posicao -
                    eletricistaConfig.primeiroDiaFolga +
                    cicloDias) %
                  cicloDias;
              }
            }
          } else {
            // Cálculo normal para criação inicial da escala
            // Encontrar a primeira posição de FOLGA no ciclo (menor posição que é FOLGA)
            const primeiraFolga = tipoEscala.CicloPosicoes.filter(
              p => p.status === 'FOLGA'
            ).sort((a, b) => a.posicao - b.posicao)[0];

            if (primeiraFolga) {
              // Calcular posição inicial: quando primeiroDiaFolga acontece,
              // o eletricista deve estar na primeira posição de folga
              posicaoInicial =
                (primeiraFolga.posicao -
                  eletricistaConfig.primeiroDiaFolga +
                  cicloDias) %
                cicloDias;
            }
          }
        }
        // Para SEMANA_DEPENDENTE, não precisamos calcular posição inicial
        // pois cada dia/semana tem sua própria máscara

        return {
          ...eletricistaConfig,
          posicaoInicial,
        };
      }
    );

    let currentDate = new Date(dataInicio);
    currentDate.setHours(0, 0, 0, 0);

    // ✅ CORREÇÃO: Calcular diaIndex desde o início do período original
    // para manter continuidade do ciclo ao prolongar escala
    const diffMs = currentDate.getTime() - periodoInicio.getTime();
    let diaIndex = Math.floor(diffMs / (1000 * 60 * 60 * 24)); // Índice do dia desde o início da escala

    // Normalizar dataFim para comparação correta
    const dataFimNormalizada = new Date(dataFim);
    dataFimNormalizada.setHours(23, 59, 59, 999);

    // ✅ PROTEÇÃO: Limitar número máximo de dias para evitar loop infinito
    const maxDias = 365 * 2; // Máximo 2 anos
    let diasProcessados = 0;

    // Para cada dia do período
    while (currentDate <= dataFimNormalizada && diasProcessados < maxDias) {
      // Buscar horários vigentes para este dia
      const horarios = await horarioVigente(periodo.equipeId, currentDate);

      // Para cada eletricista selecionado, criar um slot
      for (const eletricistaConfig of eletricistasComPosicao) {
        let statusEletricista: 'TRABALHO' | 'FOLGA';

        if (tipoEscala.modoRepeticao === 'CICLO_DIAS') {
          // Para ciclo de dias, calcula a posição no ciclo
          const cicloDias = tipoEscala.cicloDias || 1;
          // ✅ CORREÇÃO: posicaoAtual deve ser 0-indexed (0..N-1) para corresponder ao banco
          // As posições no banco são armazenadas como 0-indexed (0, 1, 2, 3, 4, 5)
          const posicaoAtual =
            (eletricistaConfig.posicaoInicial + diaIndex) % cicloDias;

          // Busca o status configurado para essa posição
          const posicaoConfig = tipoEscala.CicloPosicoes.find(
            p => p.posicao === posicaoAtual
          );
          statusEletricista =
            posicaoConfig?.status === 'TRABALHO' ? 'TRABALHO' : 'FOLGA';
        } else {
          // Para modo semanal (SEMANA_DEPENDENTE)
          const periodicidadeSemanas = tipoEscala.periodicidadeSemanas || 1;
          const diaSemana = currentDate.getDay(); // 0=Domingo, 1=Segunda...

          // ✅ CORREÇÃO: Calcular semanaIndex baseado em semanas desde o início do período
          // IMPORTANTE: A semana começa no domingo, então precisamos calcular desde o domingo da semana do início do período
          const periodoInicioDiaSemana = periodoInicio.getDay(); // 0=Domingo, 1=Segunda...
          const diasAteDomingoInicio = periodoInicioDiaSemana; // Dias até o domingo anterior ao início
          const domingoInicioPeriodo = new Date(periodoInicio);
          domingoInicioPeriodo.setDate(
            periodoInicio.getDate() - diasAteDomingoInicio
          );
          domingoInicioPeriodo.setHours(0, 0, 0, 0);

          // Calcular diferença desde o domingo da semana do início do período
          const diffMs = currentDate.getTime() - domingoInicioPeriodo.getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const semanaIndex = Math.floor(diffDays / 7) % periodicidadeSemanas;

          // Converter dia da semana JS para enum DiaSemana
          const diasSemanaEnum = [
            'DOMINGO',
            'SEGUNDA',
            'TERCA',
            'QUARTA',
            'QUINTA',
            'SEXTA',
            'SABADO',
          ];
          const diaEnum = diasSemanaEnum[diaSemana];

          // Busca a configuração para esta semana e dia
          const mascaraConfig = tipoEscala.SemanaMascaras.find(
            m => m.semanaIndex === semanaIndex && m.dia === diaEnum
          );

          statusEletricista =
            mascaraConfig?.status === 'TRABALHO' ? 'TRABALHO' : 'FOLGA';
        }

        slotsToUpsert.push({
          escalaEquipePeriodoId: periodo.id,
          eletricistaId: eletricistaConfig.id,
          data: new Date(currentDate),
          estado: statusEletricista,
          inicioPrevisto:
            statusEletricista === 'TRABALHO' && horarios
              ? horarios.inicio
              : null,
          fimPrevisto:
            statusEletricista === 'TRABALHO' && horarios ? horarios.fim : null,
          anotacoesDia: null,
          origem: 'GERACAO',
        });
      }

      // ✅ CORREÇÃO: Incrementar data de forma segura (evita problemas ao mudar mês/ano)
      const proximaData = new Date(currentDate);
      proximaData.setDate(proximaData.getDate() + 1);
      currentDate = proximaData;
      diaIndex++;
      diasProcessados++;
    }

    // ✅ VALIDAÇÃO: Verificar se não excedeu limite de segurança
    if (diasProcessados >= maxDias) {
      throw new Error(
        `Limite de segurança atingido: tentativa de gerar mais de ${maxDias} dias de slots. Verifique o período da escala.`
      );
    }

    // ✅ OTIMIZAÇÃO: Upsert slots em transação para melhor performance e atomicidade
    await prisma.$transaction(
      async tx => {
        for (const slot of slotsToUpsert) {
          await tx.slotEscala.upsert({
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
      },
      {
        maxWait: 10000, // 10 segundos máximo de espera
        timeout: 60000, // 60 segundos timeout (para muitos slots)
      }
    );

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
  ): 'TRABALHO' | 'FOLGA' {
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

    // Validar composição diária (apenas se solicitado)
    if (input.validarComposicao) {
      await this.validarComposicaoMinimaDiaria(periodo.id);
    }

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
   * Prolonga um período de escala (estende periodoFim e volta status para RASCUNHO)
   */
  async prolongar(
    input: { escalaEquipePeriodoId: number; novoPeriodoFim: Date },
    userId: string
  ): Promise<EscalaEquipePeriodo> {
    const periodo = await this.escalaRepo.findById(input.escalaEquipePeriodoId);
    if (!periodo) {
      throw new Error('Período não encontrado');
    }

    if (periodo.status !== 'PUBLICADA') {
      throw new Error('Apenas escalas publicadas podem ser prolongadas');
    }

    if (input.novoPeriodoFim <= periodo.periodoFim) {
      throw new Error('Novo período fim deve ser maior que o período fim atual');
    }

    // Salvar periodoFim antigo para gerar slots apenas a partir do dia seguinte
    const periodoFimAntigo = new Date(periodo.periodoFim);
    const dataInicioNovosSlots = new Date(periodoFimAntigo);
    dataInicioNovosSlots.setDate(dataInicioNovosSlots.getDate() + 1);
    dataInicioNovosSlots.setHours(0, 0, 0, 0);

    // ✅ CORREÇÃO: Buscar apenas os eletricistas que já têm slots na escala original
    // Não adicionar novos eletricistas ao prolongar
    const slotsExistentes = await prisma.slotEscala.findMany({
      where: {
        escalaEquipePeriodoId: input.escalaEquipePeriodoId,
        deletedAt: null,
      },
      select: {
        eletricistaId: true,
      },
      distinct: ['eletricistaId'],
    });

    if (slotsExistentes.length === 0) {
      throw new Error('Não há slots na escala para prolongar. A escala está vazia.');
    }

    // Criar configuração dos eletricistas (gerarSlots vai buscar o último slot de cada um)
    const eletricistasConfig = slotsExistentes.map((slot) => ({
      eletricistaId: slot.eletricistaId,
      primeiroDiaFolga: 0, // Não usado ao prolongar, mas necessário para o schema
    }));

    // Atualizar período fim e voltar status para RASCUNHO
    const periodoAtualizado = await this.escalaRepo.update(
      input.escalaEquipePeriodoId,
      {
        periodoFim: input.novoPeriodoFim,
        status: 'RASCUNHO',
        observacoes: periodo.observacoes
          ? `${periodo.observacoes}\n[Prolongado em ${new Date().toLocaleDateString()}]`
          : `[Prolongado em ${new Date().toLocaleDateString()}]`,
      },
      userId
    );

    // ✅ CORREÇÃO: Gerar slots apenas para os eletricistas que já estão escalados
    await this.gerarSlots(
      {
        escalaEquipePeriodoId: input.escalaEquipePeriodoId,
        mode: 'fromDate',
        fromDate: dataInicioNovosSlots,
        eletricistasConfig, // Passar apenas os eletricistas que já têm slots
      },
      userId
    );

    return periodoAtualizado;
  }

  /**
   * Transfere escala de um eletricista para outro a partir de uma data
   */
  async transferirEscala(
    input: {
      escalaEquipePeriodoId: number;
      eletricistaOrigemId: number;
      eletricistaDestinoId: number;
      dataInicio: Date;
    },
    userId: string
  ): Promise<{ slotsTransferidos: number; slotsLiberados: number }> {
    const periodo = await this.escalaRepo.findById(input.escalaEquipePeriodoId);
    if (!periodo) {
      throw new Error('Período não encontrado');
    }

    if (periodo.status !== 'PUBLICADA') {
      throw new Error('Apenas escalas publicadas podem ter transferências');
    }

    // Validar que a data não é hoje ou antes
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataInicio = new Date(input.dataInicio);
    dataInicio.setHours(0, 0, 0, 0);

    if (dataInicio <= hoje) {
      throw new Error('A data de início da transferência deve ser a partir de amanhã');
    }

    // Validar que a data está dentro do período da escala
    const periodoInicio = new Date(periodo.periodoInicio);
    periodoInicio.setHours(0, 0, 0, 0);
    const periodoFim = new Date(periodo.periodoFim);
    periodoFim.setHours(23, 59, 59, 999);

    if (dataInicio < periodoInicio || dataInicio > periodoFim) {
      throw new Error('A data de início deve estar dentro do período da escala');
    }

    // Verificar se o eletricista origem tem slots nesta escala
    const slotsOrigem = await prisma.slotEscala.findMany({
      where: {
        escalaEquipePeriodoId: input.escalaEquipePeriodoId,
        eletricistaId: input.eletricistaOrigemId,
        data: {
          gte: dataInicio,
          lte: periodoFim,
        },
        deletedAt: null,
      },
    });

    if (slotsOrigem.length === 0) {
      throw new Error('Eletricista origem não possui slots para transferir a partir desta data');
    }

    // Verificar se o eletricista destino já está escalado em outra escala no mesmo período
    const slotsDestinoOutrasEscalas = await prisma.slotEscala.findMany({
      where: {
        eletricistaId: input.eletricistaDestinoId,
        data: {
          gte: dataInicio,
          lte: periodoFim,
        },
        escalaEquipePeriodoId: {
          not: input.escalaEquipePeriodoId, // Excluir a escala atual
        },
        deletedAt: null,
      },
      include: {
        escalaEquipePeriodo: {
          select: {
            id: true,
            equipe: {
              select: {
                nome: true,
              },
            },
          },
        },
      },
    });

    // Verificar se o eletricista destino já tem slots na mesma escala (mesma escalaEquipePeriodoId)
    // Isso causaria conflito de constraint única
    const slotsDestinoMesmaEscala = await prisma.slotEscala.findMany({
      where: {
        escalaEquipePeriodoId: input.escalaEquipePeriodoId,
        eletricistaId: input.eletricistaDestinoId,
        data: {
          gte: dataInicio,
          lte: periodoFim,
        },
        deletedAt: null,
      },
    });

    // Executar transferência em transação
    const resultado = await prisma.$transaction(async (tx) => {
      let slotsLiberados = 0;

      // Se o eletricista destino já está escalado em outras escalas, marcar seus slots como deletados (soft delete)
      if (slotsDestinoOutrasEscalas.length > 0) {
        await tx.slotEscala.updateMany({
          where: {
            id: {
              in: slotsDestinoOutrasEscalas.map(s => s.id),
            },
          },
          data: {
            deletedAt: new Date(),
            deletedBy: userId,
            updatedAt: new Date(),
            updatedBy: userId,
            observacoes: `Slot liberado para transferência de escala. Eletricista transferido para escala ${input.escalaEquipePeriodoId} em ${dataInicio.toLocaleDateString()}`,
          },
        });
        slotsLiberados = slotsDestinoOutrasEscalas.length;
      }

      // Se o eletricista destino já tem slots na mesma escala, deletá-los primeiro para evitar conflito de constraint
      if (slotsDestinoMesmaEscala.length > 0) {
        await tx.slotEscala.updateMany({
          where: {
            id: {
              in: slotsDestinoMesmaEscala.map(s => s.id),
            },
          },
          data: {
            deletedAt: new Date(),
            deletedBy: userId,
            updatedAt: new Date(),
            updatedBy: userId,
            observacoes: `Slot removido para permitir transferência de escala. Substituído por slots do eletricista ${input.eletricistaOrigemId} em ${dataInicio.toLocaleDateString()}`,
          },
        });
      }

      // Transferir slots do eletricista origem para o destino
      // Atualizar os slots existentes
      const slotsAtualizados = await tx.slotEscala.updateMany({
        where: {
          id: {
            in: slotsOrigem.map(s => s.id),
          },
        },
        data: {
          eletricistaId: input.eletricistaDestinoId,
          origem: 'REMANEJAMENTO',
          updatedAt: new Date(),
          updatedBy: userId,
          observacoes: `Transferido de eletricista ${input.eletricistaOrigemId} em ${dataInicio.toLocaleDateString()}`,
        },
      });

      return {
        slotsTransferidos: slotsAtualizados.count,
        slotsLiberados,
      };
    });

    return resultado;
  }

  /**
   * Visualiza escala com todos os slots e estatísticas
   */
  async visualizar(id: number): Promise<
    EscalaEquipePeriodo & {
      estatisticas: {
        totalSlots: number;
        eletricistasUnicos: number;
        diasComTrabalho: number;
        diasComFolga: number;
      };
    }
  > {
    const escala = await this.escalaRepo.findByIdForVisualizacao(id);

    if (!escala) {
      throw new Error('Escala não encontrada');
    }

    // Calcular estatísticas
    // O repositório retorna Slots mas o tipo TypeScript não reflete isso, então fazemos cast
    const escalaComSlots = escala as typeof escala & { Slots: Array<{ eletricistaId: number; estado: string }> };
    const eletricistasUnicos = new Set(escalaComSlots.Slots.map(s => s.eletricistaId));
    const diasComTrabalho = escalaComSlots.Slots.filter(
      s => s.estado === 'TRABALHO'
    ).length;
    const diasComFolga = escalaComSlots.Slots.filter(s => s.estado === 'FOLGA').length;

    return {
      ...escalaComSlots,
      estatisticas: {
        totalSlots: escalaComSlots.Slots.length,
        eletricistasUnicos: eletricistasUnicos.size,
        diasComTrabalho,
        diasComFolga,
      },
    };
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
    const currentDate = new Date(periodo.periodoInicio);
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

