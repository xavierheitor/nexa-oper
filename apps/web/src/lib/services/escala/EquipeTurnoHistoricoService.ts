/**
 * Serviço para EquipeTurnoHistorico
 *
 * Gerencia associação de equipes a horários com vigência temporal
 */

import { EquipeTurnoHistorico } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import {
  EquipeTurnoHistoricoCreateInput,
  EquipeTurnoHistoricoRepository,
  EquipeTurnoHistoricoUpdateInput,
} from '../../repositories/escala/EquipeTurnoHistoricoRepository';
import {
  equipeTurnoHistoricoCreateSchema,
  equipeTurnoHistoricoFilterSchema,
  equipeTurnoHistoricoUpdateSchema,
} from '../../schemas/escalaSchemas';
import { PaginatedResult } from '../../types/common';

type EquipeTurnoHistoricoCreate = z.infer<
  typeof equipeTurnoHistoricoCreateSchema
>;
type EquipeTurnoHistoricoUpdate = z.infer<
  typeof equipeTurnoHistoricoUpdateSchema
>;
type EquipeTurnoHistoricoFilter = z.infer<
  typeof equipeTurnoHistoricoFilterSchema
>;

export class EquipeTurnoHistoricoService extends AbstractCrudService<
  EquipeTurnoHistoricoCreate,
  EquipeTurnoHistoricoUpdate,
  EquipeTurnoHistoricoFilter,
  EquipeTurnoHistorico
> {
  private turnoRepo: EquipeTurnoHistoricoRepository;

  constructor() {
    const repo = new EquipeTurnoHistoricoRepository();
    // @ts-ignore - Compatibilidade de tipos do repositório
    super(repo);
    this.turnoRepo = repo;
  }

  async create(
    data: EquipeTurnoHistoricoCreate,
    userId: string
  ): Promise<EquipeTurnoHistorico> {
    // Validar sobreposição
    const temSobreposicao = await this.turnoRepo.verificarSobreposicao(
      data.equipeId,
      data.dataInicio,
      data.dataFim || null
    );

    if (temSobreposicao) {
      throw new Error(
        'Já existe um horário vigente para esta equipe neste período'
      );
    }

    const createData: EquipeTurnoHistoricoCreateInput = {
      equipeId: data.equipeId,
      horarioAberturaCatalogoId: data.horarioAberturaCatalogoId,
      dataInicio: data.dataInicio,
      dataFim: data.dataFim,
      inicioTurnoHora: data.inicioTurnoHora,
      duracaoHoras: data.duracaoHoras,
      duracaoIntervaloHoras: data.duracaoIntervaloHoras,
      motivo: data.motivo,
      observacoes: data.observacoes ?? undefined,
    };

    return this.turnoRepo.create(createData, userId);
  }

  async update(
    data: EquipeTurnoHistoricoUpdate,
    userId: string
  ): Promise<EquipeTurnoHistorico> {
    const turno = await this.turnoRepo.findById(data.id);
    if (!turno) {
      throw new Error('Registro de horário não encontrado');
    }

    // Validar sobreposição (excluindo o próprio registro)
    const temSobreposicao = await this.turnoRepo.verificarSobreposicao(
      data.equipeId,
      data.dataInicio,
      data.dataFim || null,
      data.id
    );

    if (temSobreposicao) {
      throw new Error(
        'Já existe um horário vigente para esta equipe neste período'
      );
    }

    // @ts-ignore - Compatibilidade de tipos
    const updateInput: EquipeTurnoHistoricoUpdateInput = {
      id: data.id,
      equipeId: data.equipeId,
      horarioAberturaCatalogoId: data.horarioAberturaCatalogoId,
      dataInicio: data.dataInicio,
      dataFim: data.dataFim,
      inicioTurnoHora: data.inicioTurnoHora,
      duracaoHoras: data.duracaoHoras,
      duracaoIntervaloHoras: data.duracaoIntervaloHoras,
      motivo: data.motivo,
      observacoes: data.observacoes ?? undefined,
    };

    return this.turnoRepo.update(updateInput, userId);
  }

  async list(
    params: EquipeTurnoHistoricoFilter
  ): Promise<PaginatedResult<EquipeTurnoHistorico>> {
    const { items, total } = await this.turnoRepo.list(params);
    return {
      data: items,
      total,
      totalPages: Math.ceil(total / params.pageSize),
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  /**
   * Busca o horário vigente para uma equipe em uma data específica
   */
  async buscarHorarioVigente(
    equipeId: number,
    data: Date
  ): Promise<EquipeTurnoHistorico | null> {
    return this.turnoRepo.findVigenteByEquipeAndData(equipeId, data);
  }
}

