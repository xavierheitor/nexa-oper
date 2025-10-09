/**
 * Serviço para EquipeHorarioVigencia
 *
 * Gerencia lógica de negócio para horários das equipes
 */

import { EquipeHorarioVigencia } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import {
  EquipeHorarioVigenciaCreateInput,
  EquipeHorarioVigenciaRepository,
  EquipeHorarioVigenciaUpdateInput,
} from '../../repositories/escala/EquipeHorarioVigenciaRepository';
import {
  equipeHorarioVigenciaCreateSchema,
  equipeHorarioVigenciaFilterSchema,
  equipeHorarioVigenciaUpdateSchema,
} from '../../schemas/escalaSchemas';
import { PaginatedResult } from '../../types/common';

type EquipeHorarioVigenciaCreate = z.infer<
  typeof equipeHorarioVigenciaCreateSchema
>;
type EquipeHorarioVigenciaUpdate = z.infer<
  typeof equipeHorarioVigenciaUpdateSchema
>;
type EquipeHorarioVigenciaFilter = z.infer<
  typeof equipeHorarioVigenciaFilterSchema
>;

export class EquipeHorarioVigenciaService extends AbstractCrudService<
  EquipeHorarioVigenciaCreate,
  EquipeHorarioVigenciaUpdate,
  EquipeHorarioVigenciaFilter,
  EquipeHorarioVigencia
> {
  private horarioRepo: EquipeHorarioVigenciaRepository;

  constructor() {
    const repo = new EquipeHorarioVigenciaRepository();
    // @ts-ignore - Compatibilidade de tipos do repositório
    super(repo);
    this.horarioRepo = repo;
  }

  async create(
    data: EquipeHorarioVigenciaCreate,
    userId: string
  ): Promise<EquipeHorarioVigencia> {
    // Validar se não há sobreposição de vigências
    const temSobreposicao = await this.horarioRepo.verificarSobreposicao(
      data.equipeId,
      data.vigenciaInicio,
      data.vigenciaFim || null
    );

    if (temSobreposicao) {
      throw new Error(
        'Já existe um horário vigente para esta equipe neste período'
      );
    }

    const createData: EquipeHorarioVigenciaCreateInput = {
      equipeId: data.equipeId,
      inicioTurnoHora: data.inicioTurnoHora,
      duracaoHoras: data.duracaoHoras,
      vigenciaInicio: data.vigenciaInicio,
      vigenciaFim: data.vigenciaFim,
    };

    return this.horarioRepo.create(createData, userId);
  }

  async update(
    data: EquipeHorarioVigenciaUpdate,
    userId: string
  ): Promise<EquipeHorarioVigencia> {
    const horario = await this.horarioRepo.findById(data.id);
    if (!horario) {
      throw new Error('Horário não encontrado');
    }

    // Validar se não há sobreposição de vigências (excluindo o próprio registro)
    const temSobreposicao = await this.horarioRepo.verificarSobreposicao(
      data.equipeId,
      data.vigenciaInicio,
      data.vigenciaFim || null,
      data.id
    );

    if (temSobreposicao) {
      throw new Error(
        'Já existe um horário vigente para esta equipe neste período'
      );
    }

    // @ts-ignore - Compatibilidade de tipos do repositório
    const updateInput: EquipeHorarioVigenciaUpdateInput = {
      id: data.id,
      equipeId: data.equipeId,
      inicioTurnoHora: data.inicioTurnoHora,
      duracaoHoras: data.duracaoHoras,
      vigenciaInicio: data.vigenciaInicio,
      vigenciaFim: data.vigenciaFim,
    };

    return this.horarioRepo.update(updateInput, userId);
  }

  async list(
    params: EquipeHorarioVigenciaFilter
  ): Promise<PaginatedResult<EquipeHorarioVigencia>> {
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
   * Busca o horário vigente para uma equipe em uma data específica
   */
  async buscarHorarioVigente(
    equipeId: number,
    data: Date
  ): Promise<EquipeHorarioVigencia | null> {
    return this.horarioRepo.findVigenteByEquipeAndData(equipeId, data);
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

