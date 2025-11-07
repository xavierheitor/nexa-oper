/**
 * Repositório para Justificativas de Equipe
 *
 * Implementa operações de acesso a dados para justificativas de equipe
 * (quando equipe não abre turno por motivos como veículo quebrado, falta de reposição)
 */

import { prisma } from '../db/db.service';
import type { PaginationParams } from '../types/common';

interface JustificativaEquipeFilter extends PaginationParams {
  equipeId?: number;
  dataInicio?: Date;
  dataFim?: Date;
  status?: 'pendente' | 'aprovada' | 'rejeitada';
}

interface CreateJustificativaEquipeData {
  equipeId: number;
  dataReferencia: Date;
  tipoJustificativaId: number;
  descricao?: string;
  createdBy: string;
}

export class JustificativaEquipeRepository {
  /**
   * Cria uma nova justificativa de equipe
   */
  async create(data: CreateJustificativaEquipeData) {
    return prisma.justificativaEquipe.create({
      data: {
        equipeId: data.equipeId,
        dataReferencia: data.dataReferencia,
        tipoJustificativaId: data.tipoJustificativaId,
        descricao: data.descricao || null,
        status: 'pendente',
        createdBy: data.createdBy,
        createdAt: new Date(),
      },
      include: {
        equipe: {
          select: {
            id: true,
            nome: true,
          },
        },
        tipoJustificativa: {
          select: {
            id: true,
            nome: true,
            descricao: true,
            geraFalta: true,
          },
        },
      },
    });
  }

  /**
   * Busca uma justificativa de equipe por ID
   */
  async findById(id: number) {
    return prisma.justificativaEquipe.findUnique({
      where: { id },
      include: {
        equipe: {
          select: {
            id: true,
            nome: true,
          },
        },
        tipoJustificativa: {
          select: {
            id: true,
            nome: true,
            descricao: true,
            geraFalta: true,
          },
        },
        Anexos: true,
      },
    });
  }

  /**
   * Lista justificativas de equipe com filtros e paginação
   */
  async list(params: JustificativaEquipeFilter) {
    const { page = 1, pageSize = 20, equipeId, dataInicio, dataFim, status } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};

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
      prisma.justificativaEquipe.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          equipe: {
            select: {
              id: true,
              nome: true,
            },
          },
          tipoJustificativa: {
            select: {
              id: true,
              nome: true,
              descricao: true,
              geraFalta: true,
            },
          },
        },
        orderBy: { dataReferencia: 'desc' },
      }),
      prisma.justificativaEquipe.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Atualiza o status de uma justificativa de equipe
   */
  async updateStatus(id: number, status: 'aprovada' | 'rejeitada', decidedBy: string) {
    return prisma.justificativaEquipe.update({
      where: { id },
      data: {
        status,
        decidedBy,
        decidedAt: new Date(),
      },
      include: {
        equipe: {
          select: {
            id: true,
            nome: true,
          },
        },
        tipoJustificativa: {
          select: {
            id: true,
            nome: true,
            descricao: true,
            geraFalta: true,
          },
        },
      },
    });
  }

  /**
   * Verifica se já existe justificativa para equipe e data
   */
  async findByEquipeAndData(equipeId: number, dataReferencia: Date) {
    return prisma.justificativaEquipe.findUnique({
      where: {
        dataReferencia_equipeId: {
          dataReferencia,
          equipeId,
        },
      },
    });
  }
}

