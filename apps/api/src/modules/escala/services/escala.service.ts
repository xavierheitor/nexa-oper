/**
 * Serviço responsável por toda a regra de negócio relacionada às escalas de
 * eletricistas. O objetivo principal é permitir que as equipes registrem
 * diferentes padrões de escala (como a escala espanhola e a escala 4x2) e que
 * consigam gerar agendas automáticas para cruzamento com a abertura de turnos.
 */

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '@database/database.service';
import { ContractPermission } from '@modules/engine/auth/services/contract-permissions.service';
import {
  extractAllowedContractIds,
  ensureContractPermission,
} from '@modules/engine/auth/utils/contract-helpers';
import {
  buildPaginationMeta,
  validatePaginationParams,
} from '@common/utils/pagination';
import {
  createAuditData,
  deleteAuditData,
  getDefaultUserContext,
  updateAuditData,
} from '@common/utils/audit';
import { PaginationMetaDto } from '@common/dto/pagination-meta.dto';
import {
  ESCALA_AGENDA_MAX_DIAS,
  ESCALA_ERROR_MESSAGES,
  ESCALA_ORDER_CONFIG,
  ESCALA_PAGINATION_CONFIG,
} from '../constants';
import {
  CreateEscalaDto,
  EscalaAgendaQueryDto,
  EscalaAgendaResponseDto,
  EscalaAssignDto,
  EscalaListResponseDto,
  EscalaQueryDto,
  EscalaResponseDto,
  UpdateEscalaDto,
} from '../dto';

interface FindAllParams {
  page: number;
  limit: number;
  search?: string;
  contratoId?: number;
  ativo?: boolean;
}

interface AgendaDateRange {
  dataInicio: Date;
  dataFim: Date;
}

@Injectable()
export class EscalaService {
  private readonly logger = new Logger(EscalaService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
    * Converte o DTO de query em parâmetros internos com valores padrão.
    */
  mapQueryDtoToParams(query: EscalaQueryDto): FindAllParams {
    return {
      page: query.page ?? ESCALA_PAGINATION_CONFIG.DEFAULT_PAGE,
      limit: query.limit ?? ESCALA_PAGINATION_CONFIG.DEFAULT_LIMIT,
      search: query.search,
      contratoId: query.contratoId,
      ativo: query.ativo,
    };
  }

  /**
   * Normaliza uma data para meia-noite UTC. Isso garante consistência na
   * comparação de dias independente do fuso horário do servidor.
   */
  private normalizeDate(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }

  /**
   * Calcula a diferença em dias entre duas datas normalizadas.
   */
  private differenceInDays(start: Date, end: Date): number {
    const diff = this.normalizeDate(end).getTime() - this.normalizeDate(start).getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Calcula o índice do ciclo para uma data específica.
   */
  private getCycleIndex(inicioCiclo: Date, target: Date, diasCiclo: number): number {
    const start = this.normalizeDate(inicioCiclo);
    const current = this.normalizeDate(target);
    const diffDays = this.differenceInDays(start, current);
    const normalized = ((diffDays % diasCiclo) + diasCiclo) % diasCiclo;
    return normalized;
  }

  /**
   * Constrói a cláusula WHERE utilizada nas consultas paginadas.
   */
  private buildWhereClause(
    search: string | undefined,
    contratoId: number | undefined,
    ativo: boolean | undefined,
    allowedContractIds: number[] | null
  ) {
    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (search) {
      const term = search.trim();
      where.OR = [
        { nome: { contains: term, mode: 'insensitive' as const } },
        { codigo: { contains: term, mode: 'insensitive' as const } },
      ];
    }

    if (typeof ativo === 'boolean') {
      where['ativo'] = ativo;
    }

    if (contratoId) {
      where['contratoId'] = contratoId;
    } else if (allowedContractIds) {
      where['contratoId'] = { in: allowedContractIds };
    }

    return where;
  }

  /**
   * Valida e padroniza os parâmetros de paginação.
   */
  private validatePaginationParams(page: number, limit: number): void {
    validatePaginationParams(page, limit);
  }

  /**
   * Recupera a lista paginada de escalas respeitando as permissões do usuário.
   */
  async findAll(
    params: FindAllParams,
    allowedContracts?: ContractPermission[]
  ): Promise<EscalaListResponseDto> {
    this.validatePaginationParams(params.page, params.limit);

    const allowedContractIds = extractAllowedContractIds(allowedContracts);
    if (allowedContractIds && allowedContractIds.length === 0) {
      return {
        data: [],
        meta: buildPaginationMeta(0, params.page, params.limit) as PaginationMetaDto,
        search: params.search ?? null,
        timestamp: new Date(),
      };
    }

    const whereClause = this.buildWhereClause(
      params.search,
      params.contratoId,
      params.ativo,
      allowedContractIds
    );

    try {
      const [data, total] = await this.db.getPrisma().$transaction([
        this.db.getPrisma().escala.findMany({
          where: whereClause,
          orderBy: ESCALA_ORDER_CONFIG.DEFAULT,
          skip: (params.page - 1) * params.limit,
          take: params.limit,
          include: {
            contrato: {
              select: { id: true, nome: true, numero: true },
            },
            horarios: {
              where: { deletedAt: null },
              orderBy: { indiceCiclo: 'asc' },
            },
          },
        }),
        this.db.getPrisma().escala.count({ where: whereClause }),
      ]);

      return {
        data: data as unknown as EscalaResponseDto[],
        meta: buildPaginationMeta(total, params.page, params.limit) as PaginationMetaDto,
        search: params.search ?? null,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Erro ao listar escalas', error);
      throw new BadRequestException('Erro ao listar escalas');
    }
  }

  /**
   * Busca uma escala específica incluindo seus horários.
   */
  async findOne(
    id: number,
    allowedContracts?: ContractPermission[]
  ): Promise<EscalaResponseDto> {
    const allowedContractIds = extractAllowedContractIds(allowedContracts);

    try {
      const escala = await this.db.getPrisma().escala.findFirst({
        where: { id, deletedAt: null },
        include: {
          contrato: { select: { id: true, nome: true, numero: true } },
          horarios: {
            where: { deletedAt: null },
            orderBy: { indiceCiclo: 'asc' },
          },
        },
      });

      if (!escala) {
        throw new NotFoundException(ESCALA_ERROR_MESSAGES.NOT_FOUND);
      }

      ensureContractPermission(
        escala.contratoId,
        allowedContractIds,
        ESCALA_ERROR_MESSAGES.NOT_FOUND
      );

      return escala as unknown as EscalaResponseDto;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.error(`Erro ao buscar escala ${id}`, error);
      throw new BadRequestException('Erro ao buscar escala');
    }
  }

  /**
   * Cria uma nova escala com seus horários.
   */
  async create(
    createEscalaDto: CreateEscalaDto,
    allowedContracts?: ContractPermission[]
  ): Promise<EscalaResponseDto> {
    const allowedContractIds = extractAllowedContractIds(allowedContracts);
    ensureContractPermission(
      createEscalaDto.contratoId,
      allowedContractIds,
      ESCALA_ERROR_MESSAGES.NOT_FOUND
    );

    const userContext = getDefaultUserContext();

    try {
      const existing = await this.db.getPrisma().escala.findFirst({
        where: {
          deletedAt: null,
          contratoId: createEscalaDto.contratoId,
          nome: createEscalaDto.nome.trim(),
        },
      });

      if (existing) {
        throw new ConflictException(ESCALA_ERROR_MESSAGES.DUPLICATED_NAME);
      }

      const escala = await this.db.getPrisma().escala.create({
        data: {
          nome: createEscalaDto.nome.trim(),
          descricao: createEscalaDto.descricao?.trim() ?? null,
          codigo: createEscalaDto.codigo?.trim() ?? null,
          contrato: { connect: { id: createEscalaDto.contratoId } },
          tipoVeiculo: createEscalaDto.tipoVeiculo ?? null,
          diasCiclo: createEscalaDto.diasCiclo,
          minimoEletricistas: createEscalaDto.minimoEletricistas,
          maximoEletricistas: createEscalaDto.maximoEletricistas ?? null,
          inicioCiclo: new Date(createEscalaDto.inicioCiclo),
          ativo: true,
          ...createAuditData(userContext),
          horarios: {
            create: createEscalaDto.horarios.map((horario) => ({
              indiceCiclo: horario.indiceCiclo,
              diaSemana: horario.diaSemana ?? null,
              horaInicio: horario.horaInicio ?? null,
              horaFim: horario.horaFim ?? null,
              eletricistasNecessarios: horario.eletricistasNecessarios,
              folga: horario.folga ?? false,
              etiqueta: horario.etiqueta?.trim() ?? null,
              rotacaoOffset: horario.rotacaoOffset ?? 0,
              ...createAuditData(userContext),
            })),
          },
        },
        include: {
          contrato: { select: { id: true, nome: true, numero: true } },
          horarios: {
            where: { deletedAt: null },
            orderBy: { indiceCiclo: 'asc' },
          },
        },
      });

      return escala as unknown as EscalaResponseDto;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      this.logger.error('Erro ao criar escala', error);
      throw new BadRequestException('Erro ao criar escala');
    }
  }

  /**
   * Atualiza os dados principais da escala.
   */
  async update(
    id: number,
    updateEscalaDto: UpdateEscalaDto,
    allowedContracts?: ContractPermission[]
  ): Promise<EscalaResponseDto> {
    const escala = await this.findOne(id, allowedContracts);
    const userContext = getDefaultUserContext();

    try {
      if (updateEscalaDto.nome && updateEscalaDto.nome.trim() !== escala.nome) {
        const duplicated = await this.db.getPrisma().escala.findFirst({
          where: {
            deletedAt: null,
            contratoId: escala.contrato.id,
            nome: updateEscalaDto.nome.trim(),
            id: { not: id },
          },
        });

        if (duplicated) {
          throw new ConflictException(ESCALA_ERROR_MESSAGES.DUPLICATED_NAME);
        }
      }

      const updated = await this.db.getPrisma().escala.update({
        where: { id },
        data: {
          nome: updateEscalaDto.nome?.trim(),
          descricao: updateEscalaDto.descricao?.trim(),
          codigo: updateEscalaDto.codigo?.trim(),
          tipoVeiculo: updateEscalaDto.tipoVeiculo ?? escala.tipoVeiculo,
          diasCiclo: updateEscalaDto.diasCiclo ?? escala.diasCiclo,
          minimoEletricistas:
            updateEscalaDto.minimoEletricistas ?? escala.minimoEletricistas,
          maximoEletricistas:
            updateEscalaDto.maximoEletricistas ?? escala.maximoEletricistas,
          inicioCiclo: updateEscalaDto.inicioCiclo
            ? new Date(updateEscalaDto.inicioCiclo)
            : escala.inicioCiclo,
          ativo: updateEscalaDto.ativo ?? escala.ativo,
          ...updateAuditData(userContext),
        },
        include: {
          contrato: { select: { id: true, nome: true, numero: true } },
          horarios: {
            where: { deletedAt: null },
            orderBy: { indiceCiclo: 'asc' },
          },
        },
      });

      return updated as unknown as EscalaResponseDto;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      this.logger.error(`Erro ao atualizar escala ${id}`, error);
      throw new BadRequestException('Erro ao atualizar escala');
    }
  }

  /**
   * Realiza soft delete da escala.
   */
  async remove(id: number, allowedContracts?: ContractPermission[]): Promise<void> {
    await this.findOne(id, allowedContracts);
    const userContext = getDefaultUserContext();

    try {
      await this.db.getPrisma().escala.update({
        where: { id },
        data: {
          ativo: false,
          ...deleteAuditData(userContext),
        },
      });
    } catch (error) {
      this.logger.error(`Erro ao remover escala ${id}`, error);
      throw new BadRequestException('Erro ao remover escala');
    }
  }

  /**
   * Atribui eletricistas aos horários da escala.
   */
  async assignEletricistas(
    escalaId: number,
    assignDto: EscalaAssignDto,
    allowedContracts?: ContractPermission[]
  ): Promise<EscalaResponseDto> {
    const escala = await this.findOne(escalaId, allowedContracts);

    if (!escala.ativo) {
      throw new ConflictException(ESCALA_ERROR_MESSAGES.INATIVA);
    }

    const userContext = getDefaultUserContext();

    const horarios = await this.db.getPrisma().escalaHorario.findMany({
      where: { escalaId, deletedAt: null },
      select: {
        id: true,
        eletricistasNecessarios: true,
      },
    });

    const horarioMap = new Map<number, number>();
    horarios.forEach((h) => horarioMap.set(h.id, h.eletricistasNecessarios));

    const grouped = new Map<number, typeof assignDto.alocacoes>();
    for (const item of assignDto.alocacoes) {
      if (!horarioMap.has(item.horarioId)) {
        throw new NotFoundException('Horário informado não pertence à escala');
      }
      const list = grouped.get(item.horarioId) ?? [];
      list.push(item);
      grouped.set(item.horarioId, list);
    }

    const eletricistaIds = Array.from(
      new Set(assignDto.alocacoes.map((item) => item.eletricistaId))
    );

    const eletricistas = await this.db.getPrisma().eletricista.findMany({
      where: { id: { in: eletricistaIds }, deletedAt: null },
      select: { id: true, contratoId: true },
    });

    if (eletricistas.length !== eletricistaIds.length) {
      throw new NotFoundException('Algum eletricista informado não foi encontrado');
    }

    eletricistas.forEach((eletricista) => {
      if (eletricista.contratoId !== escala.contrato.id) {
        throw new ForbiddenException('Eletricista pertence a outro contrato');
      }
    });

    grouped.forEach((items, horarioId) => {
      const required = horarioMap.get(horarioId) ?? 0;
      const activeCount = items.filter((i) => i.ativo ?? true).length;
      if (required > 0 && activeCount < required) {
        throw new BadRequestException(ESCALA_ERROR_MESSAGES.INVALID_ASSIGNMENT);
      }
    });

    try {
      await this.db.getPrisma().$transaction(async (tx) => {
        for (const [horarioId, items] of grouped.entries()) {
          await tx.escalaAlocacao.deleteMany({ where: { escalaHorarioId: horarioId } });

          await tx.escalaAlocacao.createMany({
            data: items.map((item) => ({
              escalaHorarioId: item.horarioId,
              eletricistaId: item.eletricistaId,
              ordemRotacao: item.ordemRotacao ?? 0,
              vigenciaInicio: item.vigenciaInicio
                ? new Date(item.vigenciaInicio)
                : null,
              vigenciaFim: item.vigenciaFim ? new Date(item.vigenciaFim) : null,
              ativo: item.ativo ?? true,
              createdAt: new Date(),
              createdBy: userContext.userId,
            })),
          });
        }
      });

      return this.findOne(escalaId, allowedContracts);
    } catch (error) {
      this.logger.error(`Erro ao atribuir eletricistas para escala ${escalaId}`, error);
      throw new BadRequestException('Erro ao atribuir eletricistas');
    }
  }

  /**
   * Determina o intervalo de datas padrão para geração da agenda.
   */
  private resolveAgendaRange(
    escala: EscalaResponseDto,
    query: EscalaAgendaQueryDto
  ): AgendaDateRange {
    const inicio = query.dataInicio
      ? new Date(query.dataInicio)
      : this.normalizeDate(new Date());
    const fim = query.dataFim
      ? new Date(query.dataFim)
      : this.normalizeDate(
          new Date(inicio.getTime() + (escala.diasCiclo - 1) * 24 * 60 * 60 * 1000)
        );

    const diff = this.differenceInDays(inicio, fim);
    if (diff < 0) {
      throw new BadRequestException('Data final deve ser posterior à data inicial');
    }

    if (diff > ESCALA_AGENDA_MAX_DIAS) {
      throw new BadRequestException(
        `Intervalo máximo permitido é de ${ESCALA_AGENDA_MAX_DIAS} dias`
      );
    }

    return { dataInicio: this.normalizeDate(inicio), dataFim: this.normalizeDate(fim) };
  }

  /**
   * Gera agenda calculada da escala para um intervalo.
   */
  async generateAgenda(
    escalaId: number,
    query: EscalaAgendaQueryDto,
    allowedContracts?: ContractPermission[]
  ): Promise<EscalaAgendaResponseDto> {
    const escala = await this.db.getPrisma().escala.findFirst({
      where: { id: escalaId, deletedAt: null },
      include: {
        contrato: { select: { id: true } },
        horarios: {
          where: { deletedAt: null },
          orderBy: { indiceCiclo: 'asc' },
          include: {
            alocacoes: {
              where: { deletedAt: null },
              include: {
                eletricista: {
                  select: { id: true, nome: true, matricula: true },
                },
              },
            },
          },
        },
      },
    });

    if (!escala) {
      throw new NotFoundException(ESCALA_ERROR_MESSAGES.NOT_FOUND);
    }

    const allowedContractIds = extractAllowedContractIds(allowedContracts);
    ensureContractPermission(
      escala.contratoId,
      allowedContractIds,
      ESCALA_ERROR_MESSAGES.NOT_FOUND
    );

    const range = this.resolveAgendaRange(escala as unknown as EscalaResponseDto, query);

    const dias: EscalaAgendaResponseDto['dias'] = [];

    for (
      let current = new Date(range.dataInicio);
      current <= range.dataFim;
      current = new Date(current.getTime() + 24 * 60 * 60 * 1000)
    ) {
      const indiceCiclo = this.getCycleIndex(escala.inicioCiclo, current, escala.diasCiclo);

      const slots = escala.horarios
        .filter((horario) => horario.indiceCiclo === indiceCiclo)
        .map((horario) => {
          const vigentes = horario.alocacoes.filter((alocacao) => {
            if (!alocacao.ativo) {
              return false;
            }

            const inicioVigencia = alocacao.vigenciaInicio
              ? this.normalizeDate(alocacao.vigenciaInicio)
              : null;
            const fimVigencia = alocacao.vigenciaFim
              ? this.normalizeDate(alocacao.vigenciaFim)
              : null;

            const currentNormalized = this.normalizeDate(current);

            if (inicioVigencia && currentNormalized < inicioVigencia) {
              return false;
            }

            if (fimVigencia && currentNormalized > fimVigencia) {
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

          if (!horario.folga && sorted.length > 0 && horario.eletricistasNecessarios > 0) {
            for (let i = 0; i < horario.eletricistasNecessarios; i += 1) {
              const offset = (horario.rotacaoOffset + this.differenceInDays(
                escala.inicioCiclo,
                current
              ) + i) % sorted.length;
              const index = offset < 0 ? offset + sorted.length : offset;
              selecionados.add(sorted[index].eletricistaId);
            }
          }

          return {
            horario: {
              id: horario.id,
              indiceCiclo: horario.indiceCiclo,
              diaSemana: horario.diaSemana,
              horaInicio: horario.horaInicio,
              horaFim: horario.horaFim,
              eletricistasNecessarios: horario.eletricistasNecessarios,
              folga: horario.folga,
              etiqueta: horario.etiqueta,
              rotacaoOffset: horario.rotacaoOffset,
            },
            eletricistas: sorted.map((alocacao) => ({
              id: alocacao.eletricista.id,
              nome: alocacao.eletricista.nome,
              matricula: alocacao.eletricista.matricula,
              ordemRotacao: alocacao.ordemRotacao,
              escalado: selecionados.has(alocacao.eletricista.id),
            })),
          };
        });

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
        tipoVeiculo: escala.tipoVeiculo,
        diasCiclo: escala.diasCiclo,
        inicioCiclo: escala.inicioCiclo,
      },
      dataInicio: range.dataInicio,
      dataFim: range.dataFim,
      dias,
    };
  }
}
