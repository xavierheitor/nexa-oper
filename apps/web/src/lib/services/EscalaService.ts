/**
 * Serviço de Escalas
 *
 * O serviço encapsula as regras de negócio necessárias para manipular as
 * escalas de trabalho dos eletricistas. Ele orquestra validações, chama o
 * repositório especializado e implementa funcionalidades adicionais como
 * geração de agenda preditiva e atribuição de eletricistas.
 */

import { Contrato, Escala } from '@nexa-oper/db';
import { AbstractCrudService } from '../abstracts/AbstractCrudService';
import {
  EscalaAgendaParams,
  EscalaAssign,
  EscalaCreate,
  EscalaFilter,
  EscalaUpdate,
} from '../schemas/escalaSchema';
import type { PaginatedResult } from '../types/common';
import { EscalaRepository, EscalaWithRelations } from '../repositories/EscalaRepository';

/**
 * Tipagem usada na agenda gerada pelo serviço.
 */
export interface EscalaAgendaEletricista {
  id: number;
  nome: string;
  matricula: string;
  ordemRotacao: number;
  escalado: boolean;
}

export interface EscalaAgendaSlot {
  horario: {
    id: number;
    indiceCiclo: number;
    diaSemana: number | null;
    horaInicio: string | null;
    horaFim: string | null;
    eletricistasNecessarios: number;
    folga: boolean;
    etiqueta: string | null;
    rotacaoOffset: number;
  };
  eletricistas: EscalaAgendaEletricista[];
}

export interface EscalaAgendaDia {
  data: Date;
  indiceCiclo: number;
  slots: EscalaAgendaSlot[];
}

export interface EscalaAgenda {
  escala: Pick<Escala, 'id' | 'nome' | 'diasCiclo' | 'inicioCiclo'> & {
    tipoVeiculo: Escala['tipoVeiculo'];
  };
  dataInicio: Date;
  dataFim: Date;
  dias: EscalaAgendaDia[];
}

/**
 * Serviço responsável pela lógica de escalas.
 */
export class EscalaService extends AbstractCrudService<
  EscalaCreate,
  EscalaUpdate,
  EscalaFilter,
  EscalaWithRelations
> {
  private readonly escalaRepo: EscalaRepository;

  constructor() {
    const repo = new EscalaRepository();
    super(repo);
    this.escalaRepo = repo;
  }

  /**
   * Cria uma nova escala aplicando campos de auditoria.
   */
  async create(data: any, userId: string): Promise<EscalaWithRelations> {
    // Extrai campos de auditoria adicionados pelo handleServerAction
    const { createdBy, createdAt, ...businessData } = data;

    const now = new Date();

    const horariosData = businessData.horarios.map((horario: any) => ({
      indiceCiclo: horario.indiceCiclo,
      diaSemana: horario.diaSemana ?? null,
      horaInicio: horario.horaInicio ?? null,
      horaFim: horario.horaFim ?? null,
      eletricistasNecessarios: horario.eletricistasNecessarios,
      folga: horario.folga ?? false,
      etiqueta: horario.etiqueta ?? null,
      rotacaoOffset: horario.rotacaoOffset ?? 0,
      createdAt: now,
      createdBy: userId,
    }));

    // Reconstrói com auditoria do objeto principal
    // Os horários (objetos aninhados) mantêm auditoria manual
    return this.escalaRepo.create({
      nome: businessData.nome.trim(),
      descricao: businessData.descricao?.trim() ?? null,
      codigo: businessData.codigo?.trim() ?? null,
      contrato: { connect: { id: businessData.contratoId } },
      tipoVeiculo: businessData.tipoVeiculo ?? null,
      diasCiclo: businessData.diasCiclo,
      minimoEletricistas: businessData.minimoEletricistas,
      maximoEletricistas: businessData.maximoEletricistas ?? null,
      inicioCiclo: new Date(businessData.inicioCiclo),
      ativo: businessData.ativo ?? true,
      ...(createdBy && { createdBy }),
      ...(createdAt && { createdAt }),
      horarios: {
        create: horariosData,
      },
    });
  }

  /**
   * Atualiza dados da escala e substitui os horários do ciclo.
   */
  async update(data: any, userId: string): Promise<EscalaWithRelations> {
    // Extrai campos de auditoria adicionados pelo handleServerAction
    const { updatedBy, updatedAt, ...businessData } = data;

    const now = new Date();

    // Reconstrói com auditoria
    await this.escalaRepo.update(businessData.id, {
      nome: businessData.nome.trim(),
      descricao: businessData.descricao?.trim() ?? null,
      codigo: businessData.codigo?.trim() ?? null,
      contrato: { connect: { id: businessData.contratoId } },
      tipoVeiculo: businessData.tipoVeiculo ?? null,
      diasCiclo: businessData.diasCiclo,
      minimoEletricistas: businessData.minimoEletricistas,
      maximoEletricistas: businessData.maximoEletricistas ?? null,
      inicioCiclo: new Date(businessData.inicioCiclo),
      ativo: businessData.ativo ?? true,
      ...(updatedBy && { updatedBy }),
      ...(updatedAt && { updatedAt }),
    });

    await this.escalaRepo.replaceHorarios(
      businessData.id,
      businessData.horarios,
      userId
    );

    const updated = await this.escalaRepo.findById(businessData.id);
    if (!updated) {
      throw new Error('Escala não encontrada após atualização.');
    }
    return updated;
  }

  /**
   * Remove (soft delete) a escala informada.
   */
  async delete(id: number, userId: string): Promise<EscalaWithRelations> {
    return this.escalaRepo.delete(id, userId);
  }

  /**
   * Sobrescrevemos a listagem padrão para utilizar o filtro customizado.
   */
  async list(
    params: EscalaFilter
  ): Promise<PaginatedResult<EscalaWithRelations>> {
    const finalParams: EscalaFilter = {
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 10,
      orderBy: params.orderBy ?? 'id',
      orderDir: params.orderDir ?? 'desc',
      search: params.search,
      contratoId: params.contratoId,
      ativo: params.ativo,
      include: params.include,
    };

    const { items, total } = await this.escalaRepo.listWithFilters(finalParams);
    const totalPages = Math.ceil(total / finalParams.pageSize);

    return {
      data: items,
      total,
      totalPages,
      page: finalParams.page,
      pageSize: finalParams.pageSize,
    };
  }

  /**
   * Busca uma escala por ID carregando relações completas.
   */
  async getById(id: number): Promise<EscalaWithRelations | null> {
    return this.escalaRepo.findById(id);
  }

  /**
   * Atribui eletricistas aos horários da escala.
   */
  async assignEletricistas(
    data: EscalaAssign,
    userId: string
  ): Promise<EscalaWithRelations> {
    const escala = await this.escalaRepo.findById(data.escalaId);
    if (!escala) {
      throw new Error('Escala não encontrada.');
    }

    if (data.alocacoes.length === 0) {
      await this.escalaRepo.replaceAllocations(data.escalaId, [], userId);
      const refreshed = await this.escalaRepo.findById(data.escalaId);
      if (!refreshed) {
        throw new Error('Escala não encontrada após atribuição.');
      }
      return refreshed;
    }

    const normalized = data.alocacoes.map(item => ({
      horarioId: item.horarioId,
      eletricistaId: item.eletricistaId,
      ordemRotacao: item.ordemRotacao ?? 0,
      vigenciaInicio: item.vigenciaInicio
        ? new Date(item.vigenciaInicio)
        : null,
      vigenciaFim: item.vigenciaFim ? new Date(item.vigenciaFim) : null,
      ativo: item.ativo ?? true,
    }));

    await this.escalaRepo.replaceAllocations(data.escalaId, normalized, userId);

    const updated = await this.escalaRepo.findById(data.escalaId);
    if (!updated) {
      throw new Error('Escala não encontrada após atribuição.');
    }
    return updated;
  }

  /**
   * Gera uma agenda com base no ciclo da escala e nas alocações cadastradas.
   */
  async generateAgenda(params: EscalaAgendaParams): Promise<EscalaAgenda> {
    const escala = await this.escalaRepo.findById(params.id);
    if (!escala) {
      throw new Error('Escala não encontrada.');
    }

    const range = this.resolveAgendaRange(escala, params);
    const dias: EscalaAgendaDia[] = [];

    for (
      let current = new Date(range.dataInicio);
      current <= range.dataFim;
      current = new Date(current.getTime() + 24 * 60 * 60 * 1000)
    ) {
      const indiceCiclo = this.getCycleIndex(
        escala.inicioCiclo,
        current,
        escala.diasCiclo
      );

      const slots = escala.horarios
        .filter(horario => horario.indiceCiclo === indiceCiclo)
        .map(horario => this.buildAgendaSlot(escala, horario, current));

      dias.push({
        data: this.normalizeDate(current),
        indiceCiclo,
        slots,
      });
    }

    return {
      escala: {
        id: escala.id,
        nome: escala.nome,
        diasCiclo: escala.diasCiclo,
        inicioCiclo: escala.inicioCiclo,
        tipoVeiculo: escala.tipoVeiculo,
      },
      dataInicio: range.dataInicio,
      dataFim: range.dataFim,
      dias,
    };
  }

  /**
   * Normaliza data removendo componente de horário (UTC).
   */
  private normalizeDate(date: Date): Date {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
    );
  }

  /**
   * Calcula diferença em dias entre duas datas normalizadas.
   */
  private differenceInDays(start: Date, end: Date): number {
    const diff =
      this.normalizeDate(end).getTime() - this.normalizeDate(start).getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Calcula o índice do ciclo para uma determinada data.
   */
  private getCycleIndex(
    inicioCiclo: Date,
    target: Date,
    diasCiclo: number
  ): number {
    const start = this.normalizeDate(inicioCiclo);
    const current = this.normalizeDate(target);
    const diffDays = this.differenceInDays(start, current);
    const normalized = ((diffDays % diasCiclo) + diasCiclo) % diasCiclo;
    return normalized;
  }

  /**
   * Resolve intervalo padrão para geração da agenda.
   */
  private resolveAgendaRange(
    escala: EscalaWithRelations,
    params: EscalaAgendaParams
  ): { dataInicio: Date; dataFim: Date } {
    const dataInicio = params.dataInicio
      ? this.normalizeDate(new Date(params.dataInicio))
      : this.normalizeDate(new Date());

    const dataFim = params.dataFim
      ? this.normalizeDate(new Date(params.dataFim))
      : this.normalizeDate(
          new Date(
            dataInicio.getTime() + (escala.diasCiclo - 1) * 24 * 60 * 60 * 1000
          )
        );

    if (this.differenceInDays(dataInicio, dataFim) < 0) {
      throw new Error('Data final não pode ser anterior à data inicial.');
    }

    return { dataInicio, dataFim };
  }

  /**
   * Constrói um slot da agenda calculando quais eletricistas trabalham no dia.
   */
  private buildAgendaSlot(
    escala: EscalaWithRelations,
    horario: EscalaWithRelations['horarios'][number],
    current: Date
  ): EscalaAgendaSlot {
    const vigentes = horario.alocacoes.filter(alocacao => {
      if (!alocacao.ativo) {
        return false;
      }

      const inicio = alocacao.vigenciaInicio
        ? this.normalizeDate(alocacao.vigenciaInicio)
        : null;
      const fim = alocacao.vigenciaFim
        ? this.normalizeDate(alocacao.vigenciaFim)
        : null;
      const currentNormalized = this.normalizeDate(current);

      if (inicio && currentNormalized < inicio) {
        return false;
      }

      if (fim && currentNormalized > fim) {
        return false;
      }

      return true;
    });

    const sorted = [...vigentes].sort((a, b) => {
      if (a.ordemRotacao === b.ordemRotacao) {
        return a.id - b.id;
      }
      return a.ordemRotacao - b.ordemRotacao;
    });

    const selecionados = new Set<number>();
    if (
      !horario.folga &&
      sorted.length > 0 &&
      horario.eletricistasNecessarios > 0
    ) {
      for (let i = 0; i < horario.eletricistasNecessarios; i += 1) {
        const offset =
          (horario.rotacaoOffset +
            this.differenceInDays(escala.inicioCiclo, current) +
            i) %
          sorted.length;
        const index = offset < 0 ? offset + sorted.length : offset;
        selecionados.add(sorted[index].eletricistaId);
      }
    }

    return {
      horario: {
        id: horario.id,
        indiceCiclo: horario.indiceCiclo,
        diaSemana: horario.diaSemana ?? null,
        horaInicio: horario.horaInicio ?? null,
        horaFim: horario.horaFim ?? null,
        eletricistasNecessarios: horario.eletricistasNecessarios,
        folga: horario.folga,
        etiqueta: horario.etiqueta ?? null,
        rotacaoOffset: horario.rotacaoOffset ?? 0,
      },
      eletricistas: sorted.map(alocacao => ({
        id: alocacao.eletricista.id,
        nome: alocacao.eletricista.nome,
        matricula: alocacao.eletricista.matricula,
        ordemRotacao: alocacao.ordemRotacao,
        escalado: selecionados.has(alocacao.eletricista.id),
      })),
    };
  }

  /**
   * Lista básica de escalas para selects.
   */
  async listBasic(): Promise<
    Array<Pick<Escala, 'id' | 'nome'> & { contrato: Contrato }>
  > {
    const result = await this.escalaRepo.listWithFilters({
      page: 1,
      pageSize: 100,
      orderBy: 'nome',
      orderDir: 'asc',
      search: undefined,
      contratoId: undefined,
      ativo: true,
    });

    return result.items.map(item => ({
      id: item.id,
      nome: item.nome,
      contrato: item.contrato,
    }));
  }
}
