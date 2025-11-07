/**
 * Repositório para Faltas
 *
 * Implementa operações de acesso a dados para faltas
 */

import { prisma } from '../db/db.service';
import type { PaginationParams } from '../types/common';

interface FaltaFilter extends PaginationParams {
  eletricistaId?: number;
  equipeId?: number;
  dataInicio?: Date;
  dataFim?: Date;
  status?: string;
}

export class FaltaRepository {
  /**
   * Lista faltas com filtros e paginação
   */
  async list(params: FaltaFilter) {
    const { page = 1, pageSize = 20, eletricistaId, equipeId, dataInicio, dataFim, status } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (eletricistaId) {
      where.eletricistaId = eletricistaId;
    }

    if (equipeId) {
      where.equipeId = equipeId;
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

    const [items, total] = await Promise.all([
      prisma.falta.findMany({
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
          equipe: {
            select: {
              id: true,
              nome: true,
            },
          },
          escalaSlot: true,
          Justificativas: {
            include: {
              justificativa: {
                include: {
                  tipo: true,
                },
              },
            },
          },
        },
        orderBy: { dataReferencia: 'desc' },
      }),
      prisma.falta.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Busca falta por ID
   */
  async findById(id: number) {
    return prisma.falta.findUnique({
      where: { id },
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
        escalaSlot: true,
        Justificativas: {
          include: {
            justificativa: {
              include: {
                tipo: true,
                Anexos: true,
              },
            },
          },
        },
      },
    });
  }
}

