import { Prisma, PrismaClient } from '@nexa-oper/db';

import { ReconcileStatsDto } from './dto/reconcile-response.dto';
import { calcularHorasTrabalhadas } from './reconciliacao.utils';
import { SlotComEletricista, AberturaTurno } from './types';

export async function buscarSlotsEscala(
  prisma: PrismaClient | Prisma.TransactionClient,
  inicio: Date,
  fim: Date,
  equipeId?: number
): Promise<SlotComEletricista[]> {
  const where: Prisma.SlotEscalaWhereInput = {
    data: { gte: inicio, lte: fim },
  };

  if (equipeId) {
    where.escalaEquipePeriodo = { equipeId };
  } else {
    // Se for global, apenas escalas publicadas
    where.escalaEquipePeriodo = { status: 'PUBLICADA' };
  }

  return prisma.slotEscala.findMany({
    where,
    include: {
      eletricista: {
        include: { Status: true },
      },
      escalaEquipePeriodo: true,
    },
  });
}

export async function buscarTodosSlotsDia(
  prisma: PrismaClient | Prisma.TransactionClient,
  inicio: Date,
  fim: Date
) {
  return prisma.slotEscala.findMany({
    where: {
      data: { gte: inicio, lte: fim },
      escalaEquipePeriodo: { status: 'PUBLICADA' },
    },
    select: { eletricistaId: true },
  });
}

export async function buscarAberturasDia(
  prisma: PrismaClient | Prisma.TransactionClient,
  inicio: Date,
  fim: Date
): Promise<AberturaTurno[]> {
  return prisma.turnoRealizadoEletricista.findMany({
    where: {
      turnoRealizado: {
        dataReferencia: { gte: inicio, lte: fim },
      },
    },
    include: {
      turnoRealizado: { select: { equipeId: true } },
      eletricista: { include: { Status: true } },
    },
  });
}

export async function registrarDivergencia(
  prisma: PrismaClient | Prisma.TransactionClient,
  slot: SlotComEletricista,
  equipeMockId: number,
  equipeRealId: number,
  dataReferencia: Date,
  runId: string,
  stats: ReconcileStatsDto,
  warnings: string[]
) {
  try {
    await prisma.divergenciaEscala.upsert({
      where: {
        dataReferencia_eletricistaId_equipePrevistaId_equipeRealId: {
          dataReferencia,
          eletricistaId: slot.eletricistaId,
          equipePrevistaId: equipeMockId,
          equipeRealId,
        },
      },
      update: {},
      create: {
        dataReferencia,
        equipePrevistaId: equipeMockId,
        equipeRealId,
        eletricistaId: slot.eletricistaId,
        tipo: 'equipe_divergente',
        createdBy: 'system',
      },
    });
    stats.created++;
  } catch (error) {
    const err = error as Prisma.PrismaClientKnownRequestError;
    if (err.code !== 'P2002')
      warnings.push(
        `Erro div: ${err.message || (error as Error).message || String(error)}`
      );
  }
}

export async function registrarFalta(
  prisma: PrismaClient | Prisma.TransactionClient,
  slot: SlotComEletricista,
  equipeId: number,
  dataReferencia: Date,
  statusJustifica: boolean,
  runId: string,
  stats: ReconcileStatsDto,
  warnings: string[]
) {
  // Verificar Justificativa de Equipe antes
  const justificativaEquipe = await prisma.justificativaEquipe.findUnique({
    where: {
      dataReferencia_equipeId: { dataReferencia, equipeId },
    },
    include: { tipoJustificativa: true },
  });

  if (
    justificativaEquipe?.status === 'aprovada' &&
    !justificativaEquipe.tipoJustificativa.geraFalta
  ) {
    return;
  }

  if (statusJustifica) return;

  try {
    await prisma.falta.upsert({
      where: {
        dataReferencia_equipeId_eletricistaId_motivoSistema: {
          dataReferencia,
          equipeId,
          eletricistaId: slot.eletricistaId,
          motivoSistema: 'falta_abertura',
        },
      },
      update: {},
      create: {
        dataReferencia,
        equipeId,
        eletricistaId: slot.eletricistaId,
        escalaSlotId: slot.id,
        motivoSistema: 'falta_abertura',
        status: 'pendente',
        createdBy: 'system',
      },
    });
    stats.created++;
  } catch (error) {
    const err = error as Prisma.PrismaClientKnownRequestError;
    if (err.code !== 'P2002')
      warnings.push(
        `Erro falta: ${err.message || (error as Error).message || String(error)}`
      );
  }
}

export async function registrarHoraExtra(
  prisma: PrismaClient | Prisma.TransactionClient,
  slot: SlotComEletricista,
  abertura: AberturaTurno,
  tipo: string,
  dataReferencia: Date,
  runId: string,
  stats: ReconcileStatsDto,
  warnings: string[]
) {
  if (tipo !== 'folga_trabalhada') return;

  const jaExiste = await prisma.horaExtra.findFirst({
    where: {
      turnoRealizadoEletricistaId: abertura.id,
      tipo: 'folga_trabalhada',
    },
  });
  if (jaExiste) return;

  const horasRealizadas = calcularHorasTrabalhadas(
    abertura.abertoEm,
    abertura.fechadoEm
  );
  try {
    await prisma.horaExtra.create({
      data: {
        dataReferencia,
        eletricistaId: slot.eletricistaId,
        turnoRealizadoEletricistaId: abertura.id,
        escalaSlotId: slot.id,
        tipo: 'folga_trabalhada',
        horasPrevistas: new Prisma.Decimal(0),
        horasRealizadas: new Prisma.Decimal(horasRealizadas),
        diferencaHoras: new Prisma.Decimal(horasRealizadas),
        status: 'pendente',
        createdBy: 'system',
      },
    });
    stats.created++;
  } catch (error) {
    const err = error as Prisma.PrismaClientKnownRequestError;
    if (err.code !== 'P2002')
      warnings.push(
        `Erro HE: ${err.message || (error as Error).message || String(error)}`
      );
  }
}

export async function registrarHoraExtraExtrafora(
  prisma: PrismaClient | Prisma.TransactionClient,
  eletricistaId: number,
  abertura: AberturaTurno,
  dataReferencia: Date,
  runId: string,
  stats: ReconcileStatsDto,
  warnings: string[]
) {
  const jaExiste = await prisma.horaExtra.findFirst({
    where: { turnoRealizadoEletricistaId: abertura.id, tipo: 'extrafora' },
  });
  if (jaExiste) return;

  const horasRealizadas = calcularHorasTrabalhadas(
    abertura.abertoEm,
    abertura.fechadoEm
  );
  try {
    await prisma.horaExtra.create({
      data: {
        dataReferencia,
        eletricistaId,
        turnoRealizadoEletricistaId: abertura.id,
        tipo: 'extrafora',
        horasPrevistas: new Prisma.Decimal(0),
        horasRealizadas: new Prisma.Decimal(horasRealizadas),
        diferencaHoras: new Prisma.Decimal(horasRealizadas),
        status: 'pendente',
        createdBy: 'system',
      },
    });
    stats.created++;
  } catch (error) {
    const err = error as Prisma.PrismaClientKnownRequestError;
    if (err.code !== 'P2002')
      warnings.push(
        `Erro HE Extrafora: ${err.message || (error as Error).message || String(error)}`
      );
  }
}
