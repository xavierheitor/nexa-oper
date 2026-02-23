import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { AppLogger } from '../../../core/logger/app-logger';

export interface AbrirTurnoRealizadoInput {
  equipeId: number;
  dataReferencia: Date;
  eletricistas: { eletricistaId: number; motorista?: boolean }[];
  turnoId?: number;
  origem?: 'mobile' | 'backoffice';
  abertoPor?: string;
  deviceInfo?: string;
}

@Injectable()
export class TurnoRealizadoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Cria TurnoRealizado e TurnoRealizadoEletricista quando um Turno é aberto.
   * Usado para reconciliação com escala, faltas e horas extras.
   */
  async abrirTurno(input: AbrirTurnoRealizadoInput) {
    const {
      equipeId,
      dataReferencia,
      eletricistas,
      turnoId,
      origem = 'mobile',
      abertoPor = 'system',
      deviceInfo,
    } = input;

    const abertoEm = new Date();
    const turnoRealizado = await this.prisma.turnoRealizado.create({
      data: {
        dataReferencia,
        equipeId,
        turnoId,
        origem,
        abertoEm,
        abertoPor,
        createdBy: abertoPor,
      },
    });

    await this.prisma.turnoRealizadoEletricista.createMany({
      data: eletricistas.map((e) => ({
        turnoRealizadoId: turnoRealizado.id,
        eletricistaId: e.eletricistaId,
        status: 'aberto',
        abertoEm,
        deviceInfo: deviceInfo ?? null,
        createdBy: abertoPor,
      })),
    });

    this.logger.operation('Turno realizado aberto', {
      turnoRealizadoId: turnoRealizado.id,
      turnoId,
      equipeId,
      eletricistasCount: eletricistas.length,
    });

    return turnoRealizado;
  }

  /**
   * Fecha o TurnoRealizado que está vinculado ao Turno.
   * Chamado quando o Turno é fechado.
   */
  async fecharTurnoPorTurnoId(
    turnoId: number,
    fechadoPor = 'system',
  ): Promise<void> {
    const turnoRealizado = await this.prisma.turnoRealizado.findFirst({
      where: {
        turnoId,
        fechadoEm: null,
      },
      orderBy: [{ abertoEm: 'desc' }, { id: 'desc' }],
    });

    if (!turnoRealizado) {
      this.logger.debug(
        'Nenhum TurnoRealizado aberto encontrado para turnoId',
        {
          turnoId,
        },
      );
      return;
    }

    await this.fecharTurno(turnoRealizado.id, fechadoPor);
  }

  /**
   * Fecha um TurnoRealizado pelo ID.
   *
   * Atualiza a data de fechamento e o status dos eletricistas para 'fechado'.
   *
   * @param turnoRealizadoId - ID do registro.
   * @param fechadoPor - Identificador de quem fechou (default: 'system').
   */
  async fecharTurno(
    turnoRealizadoId: number,
    fechadoPor = 'system',
  ): Promise<void> {
    const fechadoEm = new Date();

    await this.prisma.$transaction([
      this.prisma.turnoRealizado.update({
        where: { id: turnoRealizadoId },
        data: { fechadoEm, fechadoPor },
      }),
      this.prisma.turnoRealizadoEletricista.updateMany({
        where: { turnoRealizadoId },
        data: { fechadoEm, status: 'fechado' },
      }),
    ]);

    this.logger.operation('Turno realizado fechado', {
      turnoRealizadoId,
      fechadoPor,
    });
  }

  /**
   * Fallback: fecha por data e equipe quando não há turnoId.
   *
   * Útil para fechar turnos antigos ou que perderam vínculo.
   * Busca um turno realizado aberto na data/equipe informada e o encerra.
   *
   * @param dataReferencia - Data do turno.
   * @param equipeId - ID da equipe.
   * @param fechadoPor - Identificador de quem fechou.
   */
  async fecharTurnoPorDataEquipe(
    dataReferencia: Date,
    equipeId: number,
    fechadoPor = 'system',
  ): Promise<void> {
    const inicioDia = new Date(dataReferencia);
    inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(dataReferencia);
    fimDia.setHours(23, 59, 59, 999);

    const turnoRealizado = await this.prisma.turnoRealizado.findFirst({
      where: {
        equipeId,
        dataReferencia: { gte: inicioDia, lte: fimDia },
        fechadoEm: null,
      },
    });

    if (!turnoRealizado) {
      this.logger.debug('Nenhum TurnoRealizado aberto para data/equipe', {
        dataReferencia,
        equipeId,
      });
      return;
    }

    await this.fecharTurno(turnoRealizado.id, fechadoPor);
  }
}
