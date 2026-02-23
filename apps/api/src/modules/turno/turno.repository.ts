import { Injectable } from '@nestjs/common';
import type { Prisma } from '@nexa-oper/db';
import { AppError } from '../../core/errors/app-error';
import { PrismaService } from '../../database/prisma.service';
import { AbrirTurnoDto } from './dto/abrir-turno.dto';
import { FecharTurnoDto } from './dto/fechar-turno.dto';
import { TurnoQueryDto, TurnoStatus } from './dto/turno-query.dto';
import type { TurnoResponseDto } from './dto/turno-response.dto';
import type { TurnoDetalheDto } from './dto/turno-detalhe.dto';
import type { TurnoRepositoryPort } from './domain/repositories/turno-repository.port';

/**
 * Repositório para acesso a dados de Turno.
 * Encapsula consultas complexas e transações do Prisma.
 */
@Injectable()
export class TurnoRepository implements TurnoRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um registro de turno e seus relacionamentos (eletricistas).
   *
   * @param dto - Dados do turno.
   * @param tx - Transação Prisma opcional (se já estiver dentro de uma).
   * @returns O turno criado (detalhado).
   */
  async createTurno(
    dto: AbrirTurnoDto,
    tx: PrismaService = this.prisma,
  ): Promise<TurnoDetalheDto> {
    const turno = await tx.turno.create({
      data: {
        dataSolicitacao: new Date(),
        dataInicio: dto.dataInicio ?? new Date(),
        veiculoId: dto.veiculoId,
        equipeId: dto.equipeId,
        dispositivo: dto.dispositivo,
        versaoApp: dto.versaoApp,
        kmInicio: dto.kmInicio,
        createdBy: 'system',
      },
      include: {
        veiculo: true,
        equipe: true,
      },
    });

    if (dto.eletricistas?.length) {
      const eletricistasData = dto.eletricistas.map((e) => ({
        turnoId: turno.id,
        eletricistaId: e.eletricistaId,
        motorista: e.motorista ?? false,
        createdBy: 'system',
      }));
      await tx.turnoEletricista.createMany({ data: eletricistasData });
    }

    const full = await tx.turno.findUnique({
      where: { id: turno.id },
      include: {
        veiculo: true,
        equipe: true,
        TurnoEletricistas: true,
        ChecklistPreenchidos: true,
        TurnoRealizado: true,
      },
    });

    if (!full) {
      throw AppError.notFound('Turno criado não encontrado');
    }
    return this.toDetalheDto(full);
  }

  /**
   * Fecha o turno atualizando data e km final.
   *
   * @param dto - Dados de fechamento.
   * @returns O turno atualizado.
   */
  async closeTurno(dto: FecharTurnoDto): Promise<TurnoResponseDto> {
    const turnoId = dto.turnoId;
    if (turnoId == null) {
      throw AppError.validation('turnoId é obrigatório');
    }
    const kmFim = dto.kmFim ?? dto.kmFinal;
    const dataFim = dto.dataFim ?? dto.horaFim ?? new Date();

    const turno = await this.prisma.turno.update({
      where: { id: turnoId },
      data: {
        dataFim,
        KmFim: kmFim ?? undefined,
        updatedAt: new Date(),
        updatedBy: 'system',
      },
      include: {
        veiculo: true,
        equipe: true,
      },
    });

    return this.toResponseDto(turno);
  }

  /**
   * Busca turnos com filtros.
   */
  async listTurnos(query: TurnoQueryDto) {
    const {
      page = 1,
      limit = 20,
      veiculoId,
      equipeId,
      eletricistaId,
      dataInicioFrom,
      dataInicioTo,
      status,
      search,
    } = query;

    const andClauses: Prisma.TurnoWhereInput[] = [];
    if (veiculoId) andClauses.push({ veiculoId });
    if (equipeId) andClauses.push({ equipeId });
    if (status === TurnoStatus.ABERTO) andClauses.push({ dataFim: null });
    if (status === TurnoStatus.FECHADO)
      andClauses.push({ dataFim: { not: null } });
    if (dataInicioFrom || dataInicioTo) {
      andClauses.push({
        dataInicio: {
          ...(dataInicioFrom && { gte: dataInicioFrom }),
          ...(dataInicioTo && { lte: dataInicioTo }),
        },
      });
    }
    if (eletricistaId) {
      andClauses.push({
        TurnoEletricistas: { some: { eletricistaId } },
      });
    }
    if (search) {
      const s = search.trim();
      andClauses.push({
        OR: [
          { veiculo: { placa: { contains: s } } },
          { veiculo: { modelo: { contains: s } } },
          { equipe: { nome: { contains: s } } },
        ],
      });
    }
    const where: Prisma.TurnoWhereInput =
      andClauses.length > 0 ? { AND: andClauses } : {};

    const skip = (page - 1) * limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.turno.findMany({
        where,
        orderBy: { dataInicio: 'desc' },
        include: { veiculo: true, equipe: true },
        skip,
        take: limit,
      }),
      this.prisma.turno.count({ where }),
    ]);

    return {
      items: items.map((t) => this.toResponseDto(t)),
      meta: { total, page, limit },
    };
  }

  /**
   * Busca turno por ID.
   */
  async findTurnoById(
    id: number,
    detailed = false,
  ): Promise<TurnoResponseDto | TurnoDetalheDto | null> {
    const turno = await this.prisma.turno.findUnique({
      where: { id },
      include: {
        veiculo: true,
        equipe: true,
        TurnoEletricistas: true,
        ...(detailed
          ? {
              ChecklistPreenchidos: true,
              TurnoRealizado: true,
            }
          : {}),
      },
    });

    if (!turno) return null;
    return detailed ? this.toDetalheDto(turno) : this.toResponseDto(turno);
  }

  /**
   * Busca turnos para sync (modificados recentemente).
   */
  async findTurnosForSync(
    since?: Date,
    limit?: number,
  ): Promise<TurnoDetalheDto[]> {
    const where: Prisma.TurnoWhereInput = since
      ? { updatedAt: { gt: since } }
      : {};
    const items = await this.prisma.turno.findMany({
      where,
      include: {
        veiculo: true,
        equipe: true,
        TurnoEletricistas: true,
        ChecklistPreenchidos: true,
        TurnoRealizado: true,
      },
      orderBy: { updatedAt: 'asc' },
      take: limit,
    });
    return items.map((t) => this.toDetalheDto(t));
  }

  private toResponseDto(turno: {
    id: number;
    dataInicio: Date;
    dataFim: Date | null;
    kmInicio: number;
    KmFim: number | null;
    veiculo: { id: number; placa: string; modelo: string };
    equipe: { id: number; nome: string };
  }): TurnoResponseDto {
    const status = turno.dataFim == null ? 'ABERTO' : 'FECHADO';
    return {
      id: turno.id,
      dataInicio: turno.dataInicio,
      dataFim: turno.dataFim,
      status,
      kmInicio: turno.kmInicio,
      kmFim: turno.KmFim,
      veiculo: {
        id: turno.veiculo.id,
        nome: turno.veiculo.placa || turno.veiculo.modelo,
      },
      equipe: {
        id: turno.equipe.id,
        nome: turno.equipe.nome,
      },
    };
  }

  private toDetalheDto(turno: {
    id: number;
    dataInicio: Date;
    dataFim: Date | null;
    kmInicio: number;
    KmFim: number | null;
    dispositivo: string | null;
    versaoApp: string | null;
    createdAt: Date;
    updatedAt: Date | null;
    createdBy: string;
    updatedBy: string | null;
    veiculo: { id: number; placa: string; modelo: string };
    equipe: { id: number; nome: string };
    TurnoEletricistas?: { eletricistaId: number; motorista: boolean }[];
    ChecklistPreenchidos?: unknown[];
    TurnoRealizado?: unknown[];
  }): TurnoDetalheDto {
    return {
      ...this.toResponseDto(turno),
      dispositivo: turno.dispositivo ?? undefined,
      versaoApp: turno.versaoApp ?? undefined,
      createdAt: turno.createdAt,
      updatedAt: turno.updatedAt,
      createdBy: turno.createdBy,
      updatedBy: turno.updatedBy,
      eletricistas:
        turno.TurnoEletricistas?.map((e) => ({
          eletricistaId: e.eletricistaId,
          motorista: e.motorista,
        })) ?? [],
      checklists: turno.ChecklistPreenchidos ?? [],
      turnosRealizados: turno.TurnoRealizado ?? [],
    };
  }
}
