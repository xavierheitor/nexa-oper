import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PrismaTransactionClient } from '@common/types/prisma';

export interface CriarTipoDTO {
  nome: string;
  descricao?: string;
  ativo?: boolean;
  geraFalta?: boolean; // Novo campo
  createdBy: string;
}
export interface AtualizarTipoDTO {
  nome?: string;
  descricao?: string;
  ativo?: boolean;
  geraFalta?: boolean; // Novo campo
  updatedBy: string;
}

export interface CriarJustificativaDTO {
  faltaId: number;
  tipoId: number;
  descricao?: string;
  createdBy: string;
}

export interface CriarJustificativaEquipeDTO {
  dataReferencia: string; // ISO date
  equipeId: number;
  tipoJustificativaId: number;
  descricao?: string;
  createdBy: string;
}

@Injectable()
export class JustificativasService {
  constructor(private readonly db: DatabaseService) {}

  // Tipos de justificativa
  async listarTipos() {
    return this.db.getPrisma().tipoJustificativa.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
    });
  }

  async criarTipo(data: CriarTipoDTO) {
    return this.db.getPrisma().tipoJustificativa.create({
      data: {
        nome: data.nome,
        descricao: data.descricao ?? null,
        ativo: data.ativo ?? true,
        geraFalta: data.geraFalta ?? true, // Default: gera falta
        createdBy: data.createdBy,
      },
    });
  }

  async atualizarTipo(id: number, data: AtualizarTipoDTO) {
    return this.db.getPrisma().tipoJustificativa.update({
      where: { id },
      data: {
        nome: data.nome,
        descricao: data.descricao,
        ativo: data.ativo,
        geraFalta: data.geraFalta,
      },
    });
  }

  // Justificativas individuais (para faltas)
  async criarJustificativa(dto: CriarJustificativaDTO) {
    const prisma = this.db.getPrisma();
    return await prisma.$transaction(async (tx) => {
      const just = await tx.justificativa.create({
        data: {
          tipoId: dto.tipoId,
          descricao: dto.descricao ?? null,
          status: 'pendente',
          createdBy: dto.createdBy,
        },
      });
      await tx.faltaJustificativa.create({
        data: {
          faltaId: dto.faltaId,
          justificativaId: just.id,
        },
      });
      return just;
    });
  }

  async aprovarJustificativa(id: number, decidedBy: string) {
    const prisma = this.db.getPrisma();
    const just = await prisma.justificativa.update({
      where: { id },
      data: {
        status: 'aprovada',
        decidedBy,
        decidedAt: new Date(),
      },
    });
    // Atualiza faltas vinculadas
    await prisma.falta.updateMany({
      where: { Justificativas: { some: { justificativaId: id } } },
      data: { status: 'justificada' },
    });
    return just;
  }

  async rejeitarJustificativa(id: number, decidedBy: string) {
    const prisma = this.db.getPrisma();
    const just = await prisma.justificativa.update({
      where: { id },
      data: {
        status: 'rejeitada',
        decidedBy,
        decidedAt: new Date(),
      },
    });
    await prisma.falta.updateMany({
      where: { Justificativas: { some: { justificativaId: id } } },
      data: { status: 'indeferida' },
    });
    return just;
  }

  // Justificativas de Equipe (quando equipe não abre turno)
  async criarJustificativaEquipe(dto: CriarJustificativaEquipeDTO) {
    const prisma = this.db.getPrisma();
    const dataRef = new Date(dto.dataReferencia);

    // Verificar se equipe existe
    const equipe = await prisma.equipe.findUnique({
      where: { id: dto.equipeId },
    });
    if (!equipe) {
      throw new NotFoundException(`Equipe ${dto.equipeId} não encontrada`);
    }

    // Verificar se tipo de justificativa existe
    const tipoJustificativa = await prisma.tipoJustificativa.findUnique({
      where: { id: dto.tipoJustificativaId },
    });
    if (!tipoJustificativa) {
      throw new NotFoundException(
        `Tipo de justificativa ${dto.tipoJustificativaId} não encontrado`
      );
    }

    // Verificar se já existe justificativa para esta equipe nesta data
    const existente = await prisma.justificativaEquipe.findUnique({
      where: {
        dataReferencia_equipeId: {
          dataReferencia: dataRef,
          equipeId: dto.equipeId,
        },
      },
    });

    if (existente) {
      throw new BadRequestException(
        'Já existe uma justificativa para esta equipe nesta data'
      );
    }

    return await prisma.justificativaEquipe.create({
      data: {
        dataReferencia: dataRef,
        equipeId: dto.equipeId,
        tipoJustificativaId: dto.tipoJustificativaId,
        descricao: dto.descricao ?? null,
        status: 'pendente',
        createdBy: dto.createdBy,
      },
      include: {
        tipoJustificativa: true,
        equipe: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });
  }

  async aprovarJustificativaEquipe(
    id: number,
    decidedBy: string
  ): Promise<void> {
    const prisma = this.db.getPrisma();

    const justificativa = await prisma.justificativaEquipe.findUnique({
      where: { id },
      include: {
        tipoJustificativa: true,
      },
    });

    if (!justificativa) {
      throw new NotFoundException(`Justificativa ${id} não encontrada`);
    }

    await prisma.$transaction(async (tx: PrismaTransactionClient) => {
      // Atualizar status da justificativa
      await tx.justificativaEquipe.update({
        where: { id },
        data: {
          status: 'aprovada',
          decidedBy,
          decidedAt: new Date(),
        },
      });

      // Se não gera falta, remover faltas pendentes dos eletricistas da equipe nesta data
      if (!justificativa.tipoJustificativa.geraFalta) {
        // Buscar slots da escala para esta equipe nesta data
        const dataRef = new Date(justificativa.dataReferencia);
        const dataRefInicio = new Date(dataRef);
        dataRefInicio.setHours(0, 0, 0, 0);
        const dataRefFim = new Date(dataRef);
        dataRefFim.setHours(23, 59, 59, 999);

        const slots = await tx.slotEscala.findMany({
          where: {
            data: {
              gte: dataRefInicio,
              lte: dataRefFim,
            },
            escalaEquipePeriodo: {
              equipeId: justificativa.equipeId,
            },
            estado: 'TRABALHO',
          },
          select: {
            eletricistaId: true,
          },
        });

        const eletricistaIds = slots.map((s) => s.eletricistaId);

        if (eletricistaIds.length > 0) {
          // Remover faltas pendentes dos eletricistas desta equipe nesta data
          await tx.falta.deleteMany({
            where: {
              dataReferencia: {
                gte: dataRefInicio,
                lte: dataRefFim,
              },
              equipeId: justificativa.equipeId,
              eletricistaId: { in: eletricistaIds },
              status: 'pendente',
            },
          });
        }
      }
    });
  }

  async rejeitarJustificativaEquipe(id: number, decidedBy: string) {
    const prisma = this.db.getPrisma();
    return await prisma.justificativaEquipe.update({
      where: { id },
      data: {
        status: 'rejeitada',
        decidedBy,
        decidedAt: new Date(),
      },
    });
  }

  async listarJustificativasEquipe(filtros: {
    equipeId?: number;
    dataInicio?: Date;
    dataFim?: Date;
    status?: string;
  }) {
    const prisma = this.db.getPrisma();
    const where: any = {};

    if (filtros.equipeId) {
      where.equipeId = filtros.equipeId;
    }

    if (filtros.dataInicio || filtros.dataFim) {
      where.dataReferencia = {};
      if (filtros.dataInicio) {
        where.dataReferencia.gte = filtros.dataInicio;
      }
      if (filtros.dataFim) {
        where.dataReferencia.lte = filtros.dataFim;
      }
    }

    if (filtros.status) {
      where.status = filtros.status;
    }

    return await prisma.justificativaEquipe.findMany({
      where,
      include: {
        tipoJustificativa: true,
        equipe: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
      orderBy: { dataReferencia: 'desc' },
    });
  }

  async listarCasosPendentes(params: {
    equipeId?: number;
    dataInicio?: Date;
    dataFim?: Date;
    status?: 'pendente' | 'justificado' | 'ignorado';
    page?: number;
    pageSize?: number;
  }) {
    const prisma = this.db.getPrisma();
    const where: any = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.equipeId) {
      where.equipeId = params.equipeId;
    }

    if (params.dataInicio || params.dataFim) {
      where.dataReferencia = {};
      if (params.dataInicio) {
        where.dataReferencia.gte = params.dataInicio;
      }
      if (params.dataFim) {
        const dataFim = new Date(params.dataFim);
        dataFim.setHours(23, 59, 59, 999);
        where.dataReferencia.lte = dataFim;
      }
    }

    const page = params.page || 1;
    const pageSize = params.pageSize || 20;

    const [casos, total] = await Promise.all([
      prisma.casoJustificativaEquipe.findMany({
        where,
        include: {
          equipe: {
            select: {
              id: true,
              nome: true,
            },
          },
          justificativaEquipe: {
            select: {
              id: true,
              status: true,
              tipoJustificativa: {
                select: {
                  nome: true,
                  geraFalta: true,
                },
              },
            },
          },
        },
        orderBy: { dataReferencia: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.casoJustificativaEquipe.count({ where }),
    ]);

    // Para cada caso, contar quantas faltas individuais foram geradas
    const casosComFaltas = await Promise.all(
      casos.map(async (caso) => {
        const faltasCount = await prisma.falta.count({
          where: {
            equipeId: caso.equipeId,
            dataReferencia: caso.dataReferencia,
            motivoSistema: 'falta_abertura',
          },
        });

        return {
          ...caso,
          faltasGeradas: faltasCount,
        };
      })
    );

    return {
      items: casosComFaltas,
      total,
      page,
      pageSize,
    };
  }

  async ignorarCasoPendente(casoId: number, decididoPor: string) {
    const prisma = this.db.getPrisma();
    return await prisma.casoJustificativaEquipe.update({
      where: { id: casoId },
      data: {
        status: 'ignorado',
        createdBy: decididoPor,
      },
    });
  }

  async criarJustificativaDeCaso(params: {
    casoId: number;
    tipoJustificativaId: number;
    descricao?: string;
    createdBy: string;
  }) {
    const prisma = this.db.getPrisma();

    return await prisma.$transaction(async (tx) => {
      // Buscar o caso
      const caso = await tx.casoJustificativaEquipe.findUnique({
        where: { id: params.casoId },
      });

      if (!caso) {
        throw new Error('Caso não encontrado');
      }

      // Criar justificativa de equipe
      const justificativa = await tx.justificativaEquipe.create({
        data: {
          dataReferencia: caso.dataReferencia,
          equipeId: caso.equipeId,
          tipoJustificativaId: params.tipoJustificativaId,
          descricao: params.descricao,
          status: 'pendente',
          createdBy: params.createdBy,
        },
      });

      // Atualizar caso para vincular à justificativa e marcar como justificado
      await tx.casoJustificativaEquipe.update({
        where: { id: params.casoId },
        data: {
          status: 'justificado',
          justificativaEquipeId: justificativa.id,
        },
      });

      return justificativa;
    });
  }
}
