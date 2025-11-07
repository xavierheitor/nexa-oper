/**
 * Repositório para Horas Extras
 *
 * Implementa operações de acesso a dados para horas extras
 */

import { prisma } from '../db/db.service';
import type { PaginationParams } from '../types/common';

interface HoraExtraFilter extends PaginationParams {
  eletricistaId?: number;
  equipeId?: number;
  dataInicio?: Date;
  dataFim?: Date;
  status?: string;
  tipo?: string;
}

export class HoraExtraRepository {
  /**
   * Lista horas extras com filtros e paginação
   */
  async list(params: HoraExtraFilter) {
    const { page = 1, pageSize = 20, eletricistaId, equipeId, dataInicio, dataFim, status, tipo } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (eletricistaId) {
      where.eletricistaId = eletricistaId;
    }

    if (dataInicio || dataFim) {
      where.dataReferencia = {};
      if (dataInicio) {
        where.dataReferencia.gte = dataInicio;
      }
      if (dataFim) {
        where.dataReferencia.lte = dataFim;
      }
    }

    if (status) {
      where.status = status;
    }

    if (tipo) {
      where.tipo = tipo;
    }

    // Se filtrar por equipe, precisamos filtrar por turnos da equipe
    if (equipeId) {
      where.turnoRealizadoEletricista = {
        turnoRealizado: {
          equipeId,
        },
      };
    }

    const [items, total] = await Promise.all([
      prisma.horaExtra.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          eletricista: {
            select: {
              id: true,
              nome: true,
              matricula: true,
            },
          },
          turnoRealizadoEletricista: {
            include: {
              turnoRealizado: {
                select: {
                  id: true,
                  equipeId: true,
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
          escalaSlot: true,
        },
        orderBy: { dataReferencia: 'desc' },
      }),
      prisma.horaExtra.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Busca hora extra por ID
   */
  async findById(id: number) {
    return prisma.horaExtra.findUnique({
      where: { id },
      include: {
        eletricista: {
          select: {
            id: true,
            nome: true,
            matricula: true,
          },
        },
        turnoRealizadoEletricista: {
          include: {
            turnoRealizado: {
              select: {
                id: true,
                equipeId: true,
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
        escalaSlot: true,
      },
    });
  }

  /**
   * Atualiza status de hora extra (aprovar/rejeitar)
   */
  async updateStatus(id: number, status: 'aprovada' | 'rejeitada', updatedBy: string) {
    return prisma.horaExtra.update({
      where: { id },
      data: {
        status,
        updatedBy,
        updatedAt: new Date(),
      },
    });
  }
}

