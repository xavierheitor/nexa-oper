/**
 * Serviço para Justificativas de Equipe
 *
 * Implementa lógica de negócio para justificativas quando equipes não abrem turno
 */

import { prisma } from '../db/db.service';
import { JustificativaEquipeRepository } from '../repositories/JustificativaEquipeRepository';
import type { CriarJustificativaEquipeInput, ListarJustificativasEquipeInput } from '../schemas/justificativaEquipeSchema';

export class JustificativaEquipeService {
  private repo: JustificativaEquipeRepository;

  constructor() {
    this.repo = new JustificativaEquipeRepository();
  }

  /**
   * Cria uma nova justificativa de equipe
   * Valida se já existe justificativa para a equipe naquela data
   */
  async create(data: CriarJustificativaEquipeInput, userId: string) {
    const dataReferencia = new Date(data.dataReferencia);

    // Verificar se já existe justificativa para esta equipe e data
    const existente = await this.repo.findByEquipeAndData(data.equipeId, dataReferencia);
    if (existente) {
      throw new Error('Já existe uma justificativa para esta equipe nesta data');
    }

    return this.repo.create({
      equipeId: data.equipeId,
      dataReferencia,
      tipoJustificativaId: data.tipoJustificativaId,
      descricao: data.descricao,
      createdBy: userId,
    });
  }

  /**
   * Aprova uma justificativa de equipe
   * Se o tipo não gera falta, remove faltas pendentes dos eletricistas da equipe
   */
  async aprovar(id: number, userId: string) {
    const justificativa = await this.repo.findById(id);
    if (!justificativa) {
      throw new Error('Justificativa não encontrada');
    }

    if (justificativa.status !== 'pendente') {
      throw new Error('Apenas justificativas pendentes podem ser aprovadas');
    }

    // Atualizar status da justificativa
    const resultado = await this.repo.updateStatus(id, 'aprovada', userId);

    // Se não gera falta, remover faltas pendentes dos eletricistas escalados nesta equipe e data
    if (!resultado.tipoJustificativa.geraFalta) {
      await this.removerFaltasPendentes(resultado.equipeId, resultado.dataReferencia);
    }

    return resultado;
  }

  /**
   * Rejeita uma justificativa de equipe
   */
  async rejeitar(id: number, userId: string) {
    const justificativa = await this.repo.findById(id);
    if (!justificativa) {
      throw new Error('Justificativa não encontrada');
    }

    if (justificativa.status !== 'pendente') {
      throw new Error('Apenas justificativas pendentes podem ser rejeitadas');
    }

    return this.repo.updateStatus(id, 'rejeitada', userId);
  }

  /**
   * Lista justificativas de equipe com filtros
   */
  async list(params: ListarJustificativasEquipeInput) {
    const { dataInicio, dataFim, ...rest } = params;

    return this.repo.list({
      ...rest,
      dataInicio: dataInicio ? new Date(dataInicio) : undefined,
      dataFim: dataFim ? new Date(dataFim) : undefined,
      orderBy: 'dataReferencia',
      orderDir: 'desc',
    });
  }

  /**
   * Busca justificativa de equipe por ID
   */
  async getById(id: number) {
    const justificativa = await this.repo.findById(id);
    if (!justificativa) {
      throw new Error('Justificativa não encontrada');
    }
    return justificativa;
  }

  /**
   * Remove faltas pendentes dos eletricistas escalados na equipe na data
   */
  private async removerFaltasPendentes(equipeId: number, dataReferencia: Date) {
    const dataRefInicio = new Date(dataReferencia);
    dataRefInicio.setHours(0, 0, 0, 0);
    const dataRefFim = new Date(dataReferencia);
    dataRefFim.setHours(23, 59, 59, 999);

    // Buscar slots da escala para esta equipe nesta data
    const slots = await prisma.slotEscala.findMany({
      where: {
        data: {
          gte: dataRefInicio,
          lte: dataRefFim,
        },
        escalaEquipePeriodo: {
          equipeId,
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
      await prisma.falta.deleteMany({
        where: {
          dataReferencia: {
            gte: dataRefInicio,
            lte: dataRefFim,
          },
          equipeId,
          eletricistaId: { in: eletricistaIds },
          status: 'pendente',
        },
      });
    }
  }
}

