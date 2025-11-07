/**
 * Repositório para Justificativas Individuais (Eletricista)
 *
 * Implementa operações de acesso a dados para justificativas individuais
 * (atestado médico, falta pessoal, etc.)
 */

import { prisma } from '../db/db.service';
import type { PaginationParams } from '../types/common';

interface JustificativaFilter extends PaginationParams {
  eletricistaId?: number;
  equipeId?: number;
  dataInicio?: Date;
  dataFim?: Date;
  status?: 'pendente' | 'aprovada' | 'rejeitada';
}

interface CreateJustificativaData {
  faltaId: number;
  tipoJustificativaId: number;
  descricao?: string;
  createdBy: string;
}

export class JustificativaRepository {
  /**
   * Cria uma nova justificativa individual e vincula à falta
   */
  async create(data: CreateJustificativaData) {
    // Criar justificativa e vincular à falta em uma transação
    return prisma.$transaction(async (tx) => {
      const justificativa = await tx.justificativa.create({
        data: {
          tipoId: data.tipoJustificativaId,
          descricao: data.descricao || null,
          status: 'pendente',
          createdBy: data.createdBy,
          createdAt: new Date(),
        },
        include: {
          tipo: {
            select: {
              id: true,
              nome: true,
              descricao: true,
              geraFalta: true,
            },
          },
        },
      });

      // Vincular justificativa à falta
      await tx.faltaJustificativa.create({
        data: {
          faltaId: data.faltaId,
          justificativaId: justificativa.id,
          linkedAt: new Date(),
        },
      });

      return justificativa;
    });
  }

  /**
   * Busca uma justificativa por ID
   */
  async findById(id: number) {
    return prisma.justificativa.findUnique({
      where: { id },
      include: {
        tipo: {
          select: {
            id: true,
            nome: true,
            descricao: true,
            geraFalta: true,
          },
        },
        Anexos: true,
        Faltas: {
          include: {
            falta: {
              include: {
                eletricista: {
                  select: {
                    id: true,
                    nome: true,
                    matricula: true,
                  },
                },
                equipe: {
                  select: {
                    id: true,
                    nome: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Busca justificativas por falta
   */
  async findByFaltaId(faltaId: number) {
    const vinculos = await prisma.faltaJustificativa.findMany({
      where: { faltaId },
      include: {
        justificativa: {
          include: {
            tipo: {
              select: {
                id: true,
                nome: true,
                descricao: true,
                geraFalta: true,
              },
            },
            Anexos: true,
          },
        },
      },
      orderBy: { linkedAt: 'desc' },
    });

    return vinculos.map((v) => v.justificativa);
  }

  /**
   * Lista justificativas com filtros e paginação
   */
  async list(params: JustificativaFilter) {
    const { page = 1, pageSize = 20, eletricistaId, equipeId, dataInicio, dataFim, status } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    // Filtros por falta relacionada
    if (eletricistaId || equipeId || dataInicio || dataFim) {
      where.Faltas = {
        some: {
          falta: {
            ...(eletricistaId && { eletricistaId }),
            ...(equipeId && { equipeId }),
            ...(dataInicio || dataFim ? {
              dataReferencia: {
                ...(dataInicio && { gte: dataInicio }),
                ...(dataFim && { lte: dataFim }),
              },
            } : {}),
          },
        },
      };
    }

    const [items, total] = await Promise.all([
      prisma.justificativa.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          tipo: {
            select: {
              id: true,
              nome: true,
              descricao: true,
              geraFalta: true,
            },
          },
          Faltas: {
            include: {
              falta: {
                include: {
                  eletricista: {
                    select: {
                      id: true,
                      nome: true,
                      matricula: true,
                    },
                  },
                  equipe: {
                    select: {
                      id: true,
                      nome: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.justificativa.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Atualiza o status de uma justificativa
   */
  async updateStatus(id: number, status: 'aprovada' | 'rejeitada', decidedBy: string) {
    return prisma.$transaction(async (tx) => {
      const justificativa = await tx.justificativa.update({
        where: { id },
        data: {
          status,
          decidedBy,
          decidedAt: new Date(),
        },
        include: {
          tipo: true,
        },
      });

      // Atualizar status das faltas vinculadas
      const faltaStatus = status === 'aprovada' ? 'justificada' : 'indeferida';
      await tx.falta.updateMany({
        where: {
          Justificativas: {
            some: {
              justificativaId: id,
            },
          },
        },
        data: {
          status: faltaStatus,
        },
      });

      return justificativa;
    });
  }
}

