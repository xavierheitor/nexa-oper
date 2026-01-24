import { PrismaClient, Prisma } from '@nexa-oper/db';

import { ReconcileStatsDto } from './dto/reconcile-response.dto';
import {
  registrarDivergencia,
  registrarFalta,
  registrarHoraExtra,
  registrarHoraExtraExtrafora,
} from './reconciliacao-db';
import { AberturasPorEletricistaMap, SlotComEletricista } from './types';

export async function processarInteracaoSlot(
  prisma: PrismaClient | Prisma.TransactionClient,
  slot: SlotComEletricista,
  abertosPorEletricista: AberturasPorEletricistaMap,
  equipeId: number,
  dataReferencia: Date,
  runId: string,
  stats: ReconcileStatsDto,
  warnings: string[]
) {
  const aberturasEletricista = abertosPorEletricista.get(slot.eletricistaId);
  const estadoSlot = slot.estado;
  const eletricistaStatus = slot.eletricista.Status?.status || 'ATIVO';

  const statusJustificaFalta = [
    'FERIAS',
    'LICENCA_MEDICA',
    'LICENCA_MATERNIDADE',
    'LICENCA_PATERNIDADE',
    'SUSPENSAO',
    'TREINAMENTO',
    'AFastADO',
    'DESLIGADO',
    'APOSENTADO',
  ].includes(eletricistaStatus);

  // CASO 1: TRABALHO + Trabalho na mesma equipe
  if (estadoSlot === 'TRABALHO') {
    if (aberturasEletricista && aberturasEletricista.equipes.has(equipeId)) {
      // OK - Trabalho normal
      return;
    }

    // Se abriu em outra equipe (Divergência)
    if (aberturasEletricista && aberturasEletricista.equipes.size > 0) {
      const equipeRealId = [...aberturasEletricista.equipes][0];
      await registrarDivergencia(
        prisma,
        slot,
        equipeId,
        equipeRealId,
        dataReferencia,
        runId,
        stats,
        warnings
      );
      return;
    }

    // Se não abriu nada (Falta)
    await registrarFalta(
      prisma,
      slot,
      equipeId,
      dataReferencia,
      statusJustificaFalta,
      runId,
      stats,
      warnings
    );
  }

  // CASO 4: FOLGA + Trabalho (Hora Extra)
  if (estadoSlot === 'FOLGA') {
    if (aberturasEletricista && aberturasEletricista.itens.length > 0) {
      const abertura =
        aberturasEletricista.itens.find(
          a => a.turnoRealizado.equipeId === equipeId
        ) || aberturasEletricista.itens[0];
      await registrarHoraExtra(
        prisma,
        slot,
        abertura,
        'folga_trabalhada',
        dataReferencia,
        runId,
        stats,
        warnings
      );
    }
  }
}

export async function processarExtrafora(
  prisma: PrismaClient | Prisma.TransactionClient,
  abertosPorEletricista: AberturasPorEletricistaMap,
  eletricistasComEscala: Set<number>,
  dataReferencia: Date,
  runIdLabel: string, // dataRefLabel
  runId: string,
  stats: ReconcileStatsDto,
  warnings: string[]
) {
  for (const [eletricistaId, aberturas] of abertosPorEletricista.entries()) {
    const tinhaSlotNaEscala = eletricistasComEscala.has(eletricistaId);
    if (!tinhaSlotNaEscala) {
      for (const abertura of aberturas.itens) {
        await registrarHoraExtraExtrafora(
          prisma,
          eletricistaId,
          abertura,
          dataReferencia,
          runId,
          stats,
          warnings
        );
      }
    }
  }
}
