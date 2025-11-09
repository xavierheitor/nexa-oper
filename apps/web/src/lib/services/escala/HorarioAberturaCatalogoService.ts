/**
 * Serviço para HorarioAberturaCatalogo
 *
 * Gerencia catálogo de horários (presets reutilizáveis)
 */

import { HorarioAberturaCatalogo } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import {
  HorarioAberturaCatalogoCreateInput,
  HorarioAberturaCatalogoRepository,
  HorarioAberturaCatalogoUpdateInput,
} from '../../repositories/escala/HorarioAberturaCatalogoRepository';
import {
  horarioAberturaCatalogoCreateSchema,
  horarioAberturaCatalogoFilterSchema,
  horarioAberturaCatalogoUpdateSchema,
} from '../../schemas/escalaSchemas';
import { PaginatedResult } from '../../types/common';

type HorarioAberturaCatalogoCreate = z.infer<
  typeof horarioAberturaCatalogoCreateSchema
>;
type HorarioAberturaCatalogoUpdate = z.infer<
  typeof horarioAberturaCatalogoUpdateSchema
>;
type HorarioAberturaCatalogoFilter = z.infer<
  typeof horarioAberturaCatalogoFilterSchema
>;

export class HorarioAberturaCatalogoService extends AbstractCrudService<
  HorarioAberturaCatalogoCreate,
  HorarioAberturaCatalogoUpdate,
  HorarioAberturaCatalogoFilter,
  HorarioAberturaCatalogo
> {
  private horarioRepo: HorarioAberturaCatalogoRepository;

  constructor() {
    const repo = new HorarioAberturaCatalogoRepository();
    // @ts-ignore - Compatibilidade de tipos do repositório
    super(repo);
    this.horarioRepo = repo;
  }

  async create(
    data: HorarioAberturaCatalogoCreate,
    userId: string
  ): Promise<HorarioAberturaCatalogo> {
    const createData: HorarioAberturaCatalogoCreateInput = {
      nome: data.nome,
      inicioTurnoHora: data.inicioTurnoHora,
      duracaoHoras: data.duracaoHoras,
      duracaoIntervaloHoras: data.duracaoIntervaloHoras,
      ativo: data.ativo,
      observacoes: data.observacoes ?? undefined,
    };

    return this.horarioRepo.create(createData, userId);
  }

  async update(
    data: HorarioAberturaCatalogoUpdate,
    userId: string
  ): Promise<HorarioAberturaCatalogo> {
    const horario = await this.horarioRepo.findById(data.id);
    if (!horario) {
      throw new Error('Horário não encontrado');
    }

    // @ts-ignore - Compatibilidade de tipos
    const updateInput: HorarioAberturaCatalogoUpdateInput = {
      id: data.id,
      nome: data.nome,
      inicioTurnoHora: data.inicioTurnoHora,
      duracaoHoras: data.duracaoHoras,
      duracaoIntervaloHoras: data.duracaoIntervaloHoras,
      ativo: data.ativo,
      observacoes: data.observacoes ?? undefined,
    };

    return this.horarioRepo.update(data.id, updateInput, userId);
  }

  async list(
    params: HorarioAberturaCatalogoFilter
  ): Promise<PaginatedResult<HorarioAberturaCatalogo>> {
    const { items, total } = await this.horarioRepo.list(params);
    return {
      data: items,
      total,
      totalPages: Math.ceil(total / params.pageSize),
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  /**
   * Calcula o horário de fim baseado no início, duração e intervalo
   */
  calcularHorarioFim(
    inicio: string,
    duracaoHoras: number,
    intervaloHoras: number = 0
  ): string {
    const [horas, minutos, segundos] = inicio.split(':').map(Number);
    const duracaoTotal = duracaoHoras + intervaloHoras;
    const totalMinutos = horas * 60 + minutos + duracaoTotal * 60;
    const horasFim = Math.floor(totalMinutos / 60) % 24;
    const minutosFim = totalMinutos % 60;
    return `${String(horasFim).padStart(2, '0')}:${String(minutosFim).padStart(2, '0')}:${String(segundos || 0).padStart(2, '0')}`;
  }
}

