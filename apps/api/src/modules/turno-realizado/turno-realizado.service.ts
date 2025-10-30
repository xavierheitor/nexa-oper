import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface AbrirTurnoPayload {
  equipeId: number;
  dataReferencia: string; // ISO date (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)
  eletricistasAbertos: Array<{
    eletricistaId: number;
    abertoEm?: string; // ISO
    deviceInfo?: string;
  }>;
  origem?: 'mobile' | 'backoffice';
  idempotencyKey?: string;
  deviceMeta?: Record<string, unknown>;
  executadoPor: string; // userId/nome do operador
}

@Injectable()
export class TurnoRealizadoService {
  constructor(private readonly db: DatabaseService) {}

  async abrirTurno(payload: AbrirTurnoPayload) {
    const prisma = this.db.getPrisma();
    const dataRef = new Date(payload.dataReferencia);
    const origem = payload.origem ?? 'mobile';

    return await prisma.$transaction(async (tx) => {
      const turno = await tx.turnoRealizado.create({
        data: {
          dataReferencia: dataRef,
          equipeId: payload.equipeId,
          origem,
          abertoEm: new Date(),
          abertoPor: payload.executadoPor,
          createdBy: payload.executadoPor,
        },
      });

      if (payload.eletricistasAbertos?.length) {
        await tx.turnoRealizadoEletricista.createMany({
          data: payload.eletricistasAbertos.map((e) => ({
            turnoRealizadoId: turno.id,
            eletricistaId: e.eletricistaId,
            status: 'aberto',
            abertoEm: e.abertoEm ? new Date(e.abertoEm) : new Date(),
            deviceInfo: e.deviceInfo,
            createdBy: payload.executadoPor,
          })),
          skipDuplicates: true,
        });
      }

      // Placeholder: agendar job assíncrono de reconciliação (a ser implementado)
      // ex.: this.jobs.enqueueReconciliacao({ data: dataRef, equipeId: payload.equipeId })

      return turno;
    });
  }

  async fecharTurno(turnoId: number, executadoPor: string) {
    const prisma = this.db.getPrisma();
    return await prisma.turnoRealizado.update({
      where: { id: turnoId },
      data: {
        fechadoEm: new Date(),
        fechadoPor: executadoPor,
      },
    });
  }

  async resumo(params: { data: string; equipeId: number }) {
    const prisma = this.db.getPrisma();
    const dataRef = new Date(params.data);

    const [slots, aberturas, faltas, divergencias] = await Promise.all([
      prisma.slotEscala.findMany({
        where: {
          data: dataRef,
          escalaEquipePeriodo: { equipeId: params.equipeId },
        },
        select: { eletricistaId: true },
      }),
      prisma.turnoRealizadoEletricista.findMany({
        where: { turnoRealizado: { dataReferencia: dataRef, equipeId: params.equipeId } },
        select: { eletricistaId: true },
      }),
      prisma.falta.findMany({
        where: { dataReferencia: dataRef, equipeId: params.equipeId },
      }),
      prisma.divergenciaEscala.findMany({
        where: { dataReferencia: dataRef, equipePrevistaId: params.equipeId },
      }),
    ]);

    const escalados = new Set(slots.map((s) => s.eletricistaId));
    const abriram = new Set(aberturas.map((a) => a.eletricistaId));

    const presentes = [...abriram];
    const ausentes = [...escalados].filter((id) => !abriram.has(id));

    return {
      data: params.data,
      equipeId: params.equipeId,
      contagens: {
        escalados: escalados.size,
        presentes: presentes.length,
        ausentes: ausentes.length,
        faltas: faltas.length,
        divergencias: divergencias.length,
      },
      faltas,
      divergencias,
    };
  }
}


