/**
 * Serviço para Turnos
 *
 * Gerencia lógica de negócio para turnos, incluindo criação,
 * atualização, listagem e exclusão.
 */

import { Turno } from '@nexa-oper/db';
import { AbstractCrudService } from '../abstracts/AbstractCrudService';
import {
  TurnoCreate,
  TurnoFilter,
  TurnoUpdate,
} from '../schemas/turnoSchema';
import {
  TurnoCreateInput,
  TurnoRepository,
  TurnoUpdateInput,
} from '../repositories/TurnoRepository';
import { PaginatedResult } from '../types/common';

export class TurnoService extends AbstractCrudService<
  TurnoCreate,
  TurnoUpdate,
  TurnoFilter,
  Turno
> {
  private turnoRepo: TurnoRepository;

  constructor() {
    const repo = new TurnoRepository();
    super(repo);
    this.turnoRepo = repo;
  }

  /**
   * Cria um novo turno
   */
  async create(data: TurnoCreate, userId: string): Promise<Turno> {
    const createData: TurnoCreateInput = {
      dataSolicitacao: data.dataSolicitacao,
      dataInicio: data.dataInicio,
      dataFim: data.dataFim,
      veiculoId: data.veiculoId,
      equipeId: data.equipeId,
      dispositivo: data.dispositivo,
      kmInicio: data.kmInicio,
      kmFim: data.kmFim,
      eletricistaIds: data.eletricistaIds,
    };

    return this.turnoRepo.create(createData, userId);
  }

  /**
   * Atualiza um turno existente
   */
  async update(data: TurnoUpdate, userId: string): Promise<Turno> {
    const updateData: TurnoUpdateInput = {
      id: data.id,
      dataSolicitacao: data.dataSolicitacao,
      dataInicio: data.dataInicio,
      dataFim: data.dataFim,
      veiculoId: data.veiculoId,
      equipeId: data.equipeId,
      dispositivo: data.dispositivo,
      kmInicio: data.kmInicio,
      kmFim: data.kmFim,
      eletricistaIds: data.eletricistaIds,
    };

    return this.turnoRepo.update(data.id, updateData, userId);
  }

  /**
   * Lista turnos com paginação e filtros
   */
  async list(params: TurnoFilter): Promise<PaginatedResult<Turno>> {
    const { items, total } = await this.turnoRepo.list(params);
    return {
      data: items,
      total,
      totalPages: Math.ceil(total / params.pageSize),
      page: params.page,
      pageSize: params.pageSize,
    };
  }
}
