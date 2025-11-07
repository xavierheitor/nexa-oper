import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { TurnoReconciliacaoService } from './turno-reconciliacao.service';
import { ConsolidadoEletricistaQueryDto, PeriodoTipo } from './dto/consolidado-eletricista-query.dto';
import { ConsolidadoEquipeQueryDto } from './dto/consolidado-equipe-query.dto';
import { FaltaFilterDto } from './dto/falta-filter.dto';
import { HoraExtraFilterDto } from './dto/hora-extra-filter.dto';
import { AprovarHoraExtraDto, AcaoAprovacao } from './dto/aprovar-hora-extra.dto';
import { Prisma } from '@nexa-oper/db';

export interface AbrirTurnoPayload {
  equipeId: number;
  dataReferencia: string; // ISO date (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)
  eletricistasAbertos: Array<{
    eletricistaId: number;
    abertoEm?: string; // ISO
    deviceInfo?: string;
  }>;
  origem?: 'mobile' | 'backoffice';
  idempotencyKey?: string;
  deviceMeta?: Record<string, unknown>;
  executadoPor: string; // userId/nome do operador
}

@Injectable()
export class TurnoRealizadoService {
  private readonly logger = new Logger(TurnoRealizadoService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly turnoReconciliacaoService: TurnoReconciliacaoService,
  ) {}

  async abrirTurno(payload: AbrirTurnoPayload) {
    const prisma = this.db.getPrisma();
    const dataRef = new Date(payload.dataReferencia);
    const origem = payload.origem ?? 'mobile';

    return await prisma.$transaction(async (tx) => {
      const turno = await tx.turnoRealizado.create({
        data: {
          dataReferencia: dataRef,
          equipeId: payload.equipeId,
          origem,
          abertoEm: new Date(),
          abertoPor: payload.executadoPor,
          createdBy: payload.executadoPor,
        },
      });

      if (payload.eletricistasAbertos?.length) {
        await tx.turnoRealizadoEletricista.createMany({
          data: payload.eletricistasAbertos.map((e) => ({
            turnoRealizadoId: turno.id,
            eletricistaId: e.eletricistaId,
            status: 'aberto',
            abertoEm: e.abertoEm ? new Date(e.abertoEm) : new Date(),
            deviceInfo: e.deviceInfo,
            createdBy: payload.executadoPor,
          })),
          skipDuplicates: true,
        });
      }

      return turno;
    });

    // Executar reconciliação assíncrona (fora da transação para não bloquear)
    this.turnoReconciliacaoService
      .reconciliarDiaEquipe({
        dataReferencia: payload.dataReferencia,
        equipePrevistaId: payload.equipeId,
        executadoPor: payload.executadoPor,
      })
      .then(() => {
        this.logger.log(
          `Reconciliação concluída para equipe ${payload.equipeId} em ${payload.dataReferencia}`
        );
      })
      .catch((error) => {
        this.logger.error('Erro na reconciliação:', error);
      });
  }

  async fecharTurno(turnoId: number, executadoPor: string) {
    const prisma = this.db.getPrisma();
    return await prisma.turnoRealizado.update({
      where: { id: turnoId },
      data: {
        fechadoEm: new Date(),
        fechadoPor: executadoPor,
      },
    });
  }

  async resumo(params: { data: string; equipeId: number }) {
    const prisma = this.db.getPrisma();
    const dataRef = new Date(params.data);

    const [slots, aberturas, faltas, divergencias] = await Promise.all([
      prisma.slotEscala.findMany({
        where: {
          data: dataRef,
          escalaEquipePeriodo: { equipeId: params.equipeId },
        },
        select: { eletricistaId: true },
      }),
      prisma.turnoRealizadoEletricista.findMany({
        where: { turnoRealizado: { dataReferencia: dataRef, equipeId: params.equipeId } },
        select: { eletricistaId: true },
      }),
      prisma.falta.findMany({
        where: { dataReferencia: dataRef, equipeId: params.equipeId },
      }),
      prisma.divergenciaEscala.findMany({
        where: { dataReferencia: dataRef, equipePrevistaId: params.equipeId },
      }),
    ]);

    const escalados = new Set(slots.map((s) => s.eletricistaId));
    const abriram = new Set(aberturas.map((a) => a.eletricistaId));

    const presentes = [...abriram];
    const ausentes = [...escalados].filter((id) => !abriram.has(id));

    return {
      data: params.data,
      equipeId: params.equipeId,
      contagens: {
        escalados: escalados.size,
        presentes: presentes.length,
        ausentes: ausentes.length,
        faltas: faltas.length,
        divergencias: divergencias.length,
      },
      faltas,
      divergencias,
    };
  }

  /**
   * Retorna dados consolidados de frequência de um eletricista em um período
   */
  async getConsolidadoEletricista(
    eletricistaId: number,
    query: ConsolidadoEletricistaQueryDto
  ) {
    const prisma = this.db.getPrisma();

    // Verificar se eletricista existe
    const eletricista = await prisma.eletricista.findUnique({
      where: { id: eletricistaId },
      select: { id: true, nome: true, matricula: true },
    });

    if (!eletricista) {
      throw new Error(`Eletricista ${eletricistaId} não encontrado`);
    }

    // Calcular período
    let dataInicio: Date;
    let dataFim: Date;

    if (query.periodo === PeriodoTipo.MES) {
      const agora = new Date();
      dataInicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
      dataFim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (query.periodo === PeriodoTipo.TRIMESTRE) {
      const agora = new Date();
      const trimestre = Math.floor(agora.getMonth() / 3);
      dataInicio = new Date(agora.getFullYear(), trimestre * 3, 1);
      dataFim = new Date(agora.getFullYear(), (trimestre + 1) * 3, 0, 23, 59, 59, 999);
    } else {
      dataInicio = query.dataInicio ? new Date(query.dataInicio) : new Date();
      dataFim = query.dataFim ? new Date(query.dataFim) : new Date();
    }

    // Buscar dados agregados
    const [
      turnosRealizados,
      faltas,
      horasExtras,
      slotsEscala,
    ] = await Promise.all([
      // Turnos realmente abertos
      prisma.turnoRealizadoEletricista.findMany({
        where: {
          eletricistaId,
          abertoEm: { gte: dataInicio, lte: dataFim },
        },
        include: {
          turnoRealizado: {
            select: {
              equipeId: true,
              equipe: {
                select: { id: true, nome: true },
              },
            },
          },
        },
      }),

      // Faltas
      prisma.falta.findMany({
        where: {
          eletricistaId,
          dataReferencia: { gte: dataInicio, lte: dataFim },
        },
        include: {
          Justificativas: {
            include: {
              justificativa: {
                select: { status: true },
              },
            },
          },
        },
      }),

      // Horas extras
      prisma.horaExtra.findMany({
        where: {
          eletricistaId,
          dataReferencia: { gte: dataInicio, lte: dataFim },
        },
      }),

      // Slots de escala (para calcular dias escalados)
      prisma.slotEscala.findMany({
        where: {
          eletricistaId,
          data: { gte: dataInicio, lte: dataFim },
          estado: 'TRABALHO',
        },
      }),
    ]);

    // Calcular resumo
    const diasTrabalhados = new Set(
      turnosRealizados.map((t) => t.abertoEm.toISOString().split('T')[0])
    ).size;

    const diasEscalados = slotsEscala.length;
    const faltasTotal = faltas.length;
    const faltasJustificadas = faltas.filter(
      (f) => f.status === 'justificada'
    ).length;
    const faltasPendentes = faltas.filter(
      (f) => f.status === 'pendente'
    ).length;

    const horasExtrasTotal = horasExtras.reduce(
      (sum, he) => sum + Number(he.horasRealizadas),
      0
    );
    const horasExtrasAprovadas = horasExtras
      .filter((he) => he.status === 'aprovada')
      .reduce((sum, he) => sum + Number(he.horasRealizadas), 0);
    const horasExtrasPendentes = horasExtras
      .filter((he) => he.status === 'pendente')
      .reduce((sum, he) => sum + Number(he.horasRealizadas), 0);

    // Detalhamento por dia
    const detalhamento: any[] = [];
    const diasProcessados = new Set<string>();

    // Processar turnos realizados
    for (const turno of turnosRealizados) {
      const dataStr = turno.abertoEm.toISOString().split('T')[0];
      if (!diasProcessados.has(dataStr)) {
        diasProcessados.add(dataStr);
        const horasRealizadas = turno.fechadoEm
          ? (turno.fechadoEm.getTime() - turno.abertoEm.getTime()) / (1000 * 60 * 60)
          : 0;

        detalhamento.push({
          data: turno.abertoEm,
          tipo: 'trabalho',
          horasPrevistas: 0, // Será calculado se houver slot
          horasRealizadas,
          status: 'normal',
        });
      }
    }

    // Processar faltas
    for (const falta of faltas) {
      const dataStr = falta.dataReferencia.toISOString().split('T')[0];
      if (!diasProcessados.has(dataStr)) {
        diasProcessados.add(dataStr);
        detalhamento.push({
          data: falta.dataReferencia,
          tipo: 'falta',
          horasPrevistas: 0,
          horasRealizadas: 0,
          status: falta.status,
          faltaId: falta.id,
        });
      }
    }

    // Processar horas extras
    for (const horaExtra of horasExtras) {
      const dataStr = horaExtra.dataReferencia.toISOString().split('T')[0];
      const existing = detalhamento.find(
        (d) => d.data.toISOString().split('T')[0] === dataStr
      );
      if (existing) {
        existing.tipo = 'hora_extra';
        existing.tipoHoraExtra = horaExtra.tipo;
        existing.horaExtraId = horaExtra.id;
      } else {
        detalhamento.push({
          data: horaExtra.dataReferencia,
          tipo: 'hora_extra',
          horasPrevistas: Number(horaExtra.horasPrevistas || 0),
          horasRealizadas: Number(horaExtra.horasRealizadas),
          tipoHoraExtra: horaExtra.tipo,
          status: horaExtra.status,
          horaExtraId: horaExtra.id,
        });
      }
    }

    detalhamento.sort((a, b) => a.data.getTime() - b.data.getTime());

    return {
      eletricista: {
        id: eletricista.id,
        nome: eletricista.nome,
        matricula: eletricista.matricula,
      },
      periodo: {
        dataInicio,
        dataFim,
      },
      resumo: {
        diasTrabalhados,
        diasEscalados,
        faltas: faltasTotal,
        faltasJustificadas,
        faltasPendentes,
        horasExtras: horasExtrasTotal,
        horasExtrasAprovadas,
        horasExtrasPendentes,
        atrasos: 0, // TODO: calcular atrasos
        divergenciasEquipe: 0, // TODO: calcular divergências
      },
      detalhamento,
    };
  }

  /**
   * Retorna dados consolidados de frequência de todos os eletricistas de uma equipe
   */
  async getConsolidadoEquipe(equipeId: number, query: ConsolidadoEquipeQueryDto) {
    const prisma = this.db.getPrisma();

    // Verificar se equipe existe
    const equipe = await prisma.equipe.findUnique({
      where: { id: equipeId },
      select: { id: true, nome: true },
    });

    if (!equipe) {
      throw new Error(`Equipe ${equipeId} não encontrada`);
    }

    const dataInicio = new Date(query.dataInicio);
    const dataFim = new Date(query.dataFim);

    // Buscar eletricistas da equipe (via slots de escala no período)
    const slotsEscala = await prisma.slotEscala.findMany({
      where: {
        escalaEquipePeriodo: { equipeId },
        data: { gte: dataInicio, lte: dataFim },
      },
      select: {
        eletricistaId: true,
        eletricista: {
          select: { id: true, nome: true, matricula: true },
        },
      },
      distinct: ['eletricistaId'],
    });

    const eletricistasIds = slotsEscala.map((s) => s.eletricistaId);

    // Buscar dados agregados para cada eletricista
    const [turnos, faltas, horasExtras] = await Promise.all([
      prisma.turnoRealizadoEletricista.findMany({
        where: {
          eletricistaId: { in: eletricistasIds },
          abertoEm: { gte: dataInicio, lte: dataFim },
        },
      }),
      prisma.falta.findMany({
        where: {
          eletricistaId: { in: eletricistasIds },
          dataReferencia: { gte: dataInicio, lte: dataFim },
        },
      }),
      prisma.horaExtra.findMany({
        where: {
          eletricistaId: { in: eletricistasIds },
          dataReferencia: { gte: dataInicio, lte: dataFim },
        },
      }),
    ]);

    // Agrupar por eletricista
    const eletricistas = slotsEscala.map((slot) => {
      const eletricistaId = slot.eletricistaId;
      const turnosEletricista = turnos.filter((t) => t.eletricistaId === eletricistaId);
      const faltasEletricista = faltas.filter((f) => f.eletricistaId === eletricistaId);
      const horasExtrasEletricista = horasExtras.filter(
        (he) => he.eletricistaId === eletricistaId
      );

      const diasTrabalhados = new Set(
        turnosEletricista.map((t) => t.abertoEm.toISOString().split('T')[0])
      ).size;

      const horasExtrasTotal = horasExtrasEletricista.reduce(
        (sum, he) => sum + Number(he.horasRealizadas),
        0
      );

      return {
        eletricista: {
          id: slot.eletricista.id,
          nome: slot.eletricista.nome,
          matricula: slot.eletricista.matricula,
        },
        resumo: {
          diasTrabalhados,
          faltas: faltasEletricista.length,
          horasExtras: horasExtrasTotal,
        },
      };
    });

    return {
      equipe: {
        id: equipe.id,
        nome: equipe.nome,
      },
      periodo: {
        dataInicio,
        dataFim,
      },
      eletricistas,
    };
  }

  /**
   * Retorna aderência de equipe (percentual de execução da escala)
   */
  async getAderenciaEquipe(
    equipeId: number,
    query: ConsolidadoEquipeQueryDto
  ) {
    const prisma = this.db.getPrisma();

    // Verificar se equipe existe
    const equipe = await prisma.equipe.findUnique({
      where: { id: equipeId },
      select: { id: true, nome: true },
    });

    if (!equipe) {
      throw new Error(`Equipe ${equipeId} não encontrada`);
    }

    const dataInicio = new Date(query.dataInicio);
    const dataFim = new Date(query.dataFim);

    // Buscar slots da escala (previstos)
    const slotsEscala = await prisma.slotEscala.findMany({
      where: {
        escalaEquipePeriodo: { equipeId },
        data: { gte: dataInicio, lte: dataFim },
        estado: 'TRABALHO',
      },
      include: {
        eletricista: {
          select: { id: true, nome: true, matricula: true },
        },
      },
    });

    // Buscar turnos realmente abertos pela equipe
    const turnosAbertos = await prisma.turnoRealizado.findMany({
      where: {
        equipeId,
        dataReferencia: { gte: dataInicio, lte: dataFim },
      },
      include: {
        Itens: {
          include: {
            eletricista: {
              select: { id: true, nome: true, matricula: true },
            },
          },
        },
      },
    });

    // Buscar justificativas de equipe aprovadas que não geram falta
    const justificativasEquipe = await prisma.justificativaEquipe.findMany({
      where: {
        equipeId,
        dataReferencia: { gte: dataInicio, lte: dataFim },
        status: 'aprovada',
      },
      include: {
        tipoJustificativa: true,
      },
    });

    // Agrupar slots por data
    const slotsPorData = new Map<string, typeof slotsEscala>();
    for (const slot of slotsEscala) {
      const dataStr = slot.data.toISOString().split('T')[0];
      if (!slotsPorData.has(dataStr)) {
        slotsPorData.set(dataStr, []);
      }
      slotsPorData.get(dataStr)!.push(slot);
    }

    // Agrupar turnos por data
    const turnosPorData = new Map<string, typeof turnosAbertos>();
    for (const turno of turnosAbertos) {
      const dataStr = turno.dataReferencia.toISOString().split('T')[0];
      if (!turnosPorData.has(dataStr)) {
        turnosPorData.set(dataStr, []);
      }
      turnosPorData.get(dataStr)!.push(turno);
    }

    // Agrupar justificativas por data (apenas uma por data devido ao unique constraint)
    const justificativasPorData = new Map<string, typeof justificativasEquipe[0]>();
    for (const just of justificativasEquipe) {
      const dataStr = just.dataReferencia.toISOString().split('T')[0];
      justificativasPorData.set(dataStr, just);
    }

    // Calcular métricas
    let diasEscalados = 0;
    let diasAbertos = 0;
    let diasJustificadosSemFalta = 0;
    let totalEletricistasEscalados = 0;
    let totalEletricistasQueTrabalharam = 0;
    let totalEletricistasPrevistos = 0;

    const detalhamento: Array<{
      data: Date;
      eletricistasEscalados: number;
      eletricistasQueTrabalharam: number;
      turnoAberto: boolean;
      justificativa?: {
        tipo: string;
        geraFalta: boolean;
      };
      aderencia: number;
    }> = [];

    // Processar cada dia do período
    const dataAtual = new Date(dataInicio);
    while (dataAtual <= dataFim) {
      const dataStr = dataAtual.toISOString().split('T')[0];
      const slotsDoDia = slotsPorData.get(dataStr) || [];
      const turnosDoDia = turnosPorData.get(dataStr) || [];
      const justificativaDoDia = justificativasPorData.get(dataStr);

      if (slotsDoDia.length > 0) {
        diasEscalados++;
        totalEletricistasPrevistos += slotsDoDia.length;

        const eletricistasEscalados = new Set(
          slotsDoDia.map((s) => s.eletricistaId)
        );
        const eletricistasQueTrabalharam = new Set(
          turnosDoDia.flatMap((t) => t.Itens.map((i) => i.eletricistaId))
        );

        // Se há justificativa aprovada que não gera falta, contar como trabalhado
        if (
          justificativaDoDia &&
          !justificativaDoDia.tipoJustificativa.geraFalta
        ) {
          diasJustificadosSemFalta++;
          totalEletricistasQueTrabalharam += eletricistasEscalados.size;
        } else {
          totalEletricistasQueTrabalharam += eletricistasQueTrabalharam.size;
        }

        const turnoAberto = turnosDoDia.length > 0;
        if (turnoAberto) {
          diasAbertos++;
        }

        const aderencia =
          eletricistasEscalados.size > 0
            ? (eletricistasQueTrabalharam.size / eletricistasEscalados.size) *
              100
            : 0;

        detalhamento.push({
          data: new Date(dataAtual),
          eletricistasEscalados: eletricistasEscalados.size,
          eletricistasQueTrabalharam: eletricistasQueTrabalharam.size,
          turnoAberto,
          justificativa: justificativaDoDia
            ? {
                tipo: justificativaDoDia.tipoJustificativa.nome,
                geraFalta: justificativaDoDia.tipoJustificativa.geraFalta,
              }
            : undefined,
          aderencia: Math.round(aderencia * 100) / 100,
        });
      }

      dataAtual.setDate(dataAtual.getDate() + 1);
    }

    // Calcular percentuais
    const aderenciaDias =
      diasEscalados > 0 ? (diasAbertos / diasEscalados) * 100 : 0;
    const aderenciaEletricistas =
      totalEletricistasPrevistos > 0
        ? (totalEletricistasQueTrabalharam / totalEletricistasPrevistos) *
          100
        : 0;

    return {
      equipe: {
        id: equipe.id,
        nome: equipe.nome,
      },
      periodo: {
        dataInicio,
        dataFim,
      },
      resumo: {
        diasEscalados,
        diasAbertos,
        diasJustificadosSemFalta,
        aderenciaDias: Math.round(aderenciaDias * 100) / 100,
        totalEletricistasPrevistos,
        totalEletricistasQueTrabalharam,
        aderenciaEletricistas: Math.round(aderenciaEletricistas * 100) / 100,
      },
      detalhamento,
    };
  }

  /**
   * Lista faltas com filtros e paginação
   */
  async listFaltas(filtros: FaltaFilterDto) {
    const prisma = this.db.getPrisma();

    const where: any = {};

    if (filtros.eletricistaId) {
      where.eletricistaId = filtros.eletricistaId;
    }

    if (filtros.equipeId) {
      where.equipeId = filtros.equipeId;
    }

    if (filtros.dataInicio || filtros.dataFim) {
      where.dataReferencia = {};
      if (filtros.dataInicio) {
        where.dataReferencia.gte = new Date(filtros.dataInicio);
      }
      if (filtros.dataFim) {
        where.dataReferencia.lte = new Date(filtros.dataFim);
      }
    }

    if (filtros.status) {
      where.status = filtros.status;
    }

    const page = filtros.page || 1;
    const pageSize = filtros.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const [faltas, total] = await Promise.all([
      prisma.falta.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          eletricista: {
            select: { id: true, nome: true, matricula: true },
          },
          equipe: {
            select: { id: true, nome: true },
          },
          Justificativas: {
            include: {
              justificativa: {
                select: { id: true, status: true, descricao: true },
              },
            },
          },
        },
        orderBy: { dataReferencia: 'desc' },
      }),
      prisma.falta.count({ where }),
    ]);

    return {
      data: faltas,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Lista horas extras com filtros e paginação
   */
  async listHorasExtras(filtros: HoraExtraFilterDto) {
    const prisma = this.db.getPrisma();

    const where: any = {};

    if (filtros.eletricistaId) {
      where.eletricistaId = filtros.eletricistaId;
    }

    if (filtros.dataInicio || filtros.dataFim) {
      where.dataReferencia = {};
      if (filtros.dataInicio) {
        where.dataReferencia.gte = new Date(filtros.dataInicio);
      }
      if (filtros.dataFim) {
        where.dataReferencia.lte = new Date(filtros.dataFim);
      }
    }

    if (filtros.tipo) {
      where.tipo = filtros.tipo;
    }

    if (filtros.status) {
      where.status = filtros.status;
    }

    const page = filtros.page || 1;
    const pageSize = filtros.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const [horasExtras, total] = await Promise.all([
      prisma.horaExtra.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          eletricista: {
            select: { id: true, nome: true, matricula: true },
          },
        },
        orderBy: { dataReferencia: 'desc' },
      }),
      prisma.horaExtra.count({ where }),
    ]);

    return {
      data: horasExtras.map((he) => ({
        ...he,
        horasPrevistas: Number(he.horasPrevistas || 0),
        horasRealizadas: Number(he.horasRealizadas),
        diferencaHoras: Number(he.diferencaHoras),
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Aprova ou rejeita uma hora extra
   */
  async aprovarHoraExtra(
    id: number,
    dto: AprovarHoraExtraDto,
    executadoPor: string
  ) {
    const prisma = this.db.getPrisma();

    const horaExtra = await prisma.horaExtra.findUnique({
      where: { id },
    });

    if (!horaExtra) {
      throw new Error(`Hora extra ${id} não encontrada`);
    }

    const novoStatus =
      dto.acao === AcaoAprovacao.APROVAR ? 'aprovada' : 'rejeitada';

    const atualizada = await prisma.horaExtra.update({
      where: { id },
      data: {
        status: novoStatus,
        updatedBy: executadoPor,
        observacoes: dto.observacoes
          ? `${horaExtra.observacoes || ''}\n${dto.observacoes}`.trim()
          : horaExtra.observacoes,
      },
    });

    return {
      id: atualizada.id,
      status: atualizada.status,
      updatedAt: atualizada.updatedAt,
      updatedBy: atualizada.updatedBy,
    };
  }
}


