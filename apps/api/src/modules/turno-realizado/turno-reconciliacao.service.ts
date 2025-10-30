import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface ReconciliarParams {
  dataReferencia: string; // ISO date
  equipePrevistaId: number;
  executadoPor: string;
}

@Injectable()
export class TurnoReconciliacaoService {
  constructor(private readonly db: DatabaseService) {}

  // Idempotente por chaves únicas nas tabelas
  async reconciliarDiaEquipe(params: ReconciliarParams) {
    const prisma = this.db.getPrisma();
    const dataRef = new Date(params.dataReferencia);

    // Placeholder: Selecionar slots da escala (previstos) e aberturas reais e gerar faltas/divergências
    // Implementação completa será feita no item de job assíncrono
    const slots = await prisma.slotEscala.findMany({
      where: {
        data: dataRef,
        escalaEquipePeriodo: { equipeId: params.equipePrevistaId },
      },
      select: { id: true, eletricistaId: true, escalaEquipePeriodoId: true },
    });

    const aberturasDia = await prisma.turnoRealizadoEletricista.findMany({
      where: { turnoRealizado: { dataReferencia: dataRef } },
      select: {
        eletricistaId: true,
        turnoRealizado: { select: { equipeId: true } },
      },
    });

    const abertosPorEletricista = new Map<number, Set<number>>(); // eletricista -> set de equipes reais
    for (const a of aberturasDia) {
      const set = abertosPorEletricista.get(a.eletricistaId) ?? new Set<number>();
      set.add(a.turnoRealizado.equipeId);
      abertosPorEletricista.set(a.eletricistaId, set);
    }

    for (const slot of slots) {
      const equipesReais = abertosPorEletricista.get(slot.eletricistaId);
      if (!equipesReais || equipesReais.size === 0) {
        // Criar falta pendente
        await prisma.falta.create({
          data: {
            dataReferencia: dataRef,
            equipeId: params.equipePrevistaId,
            eletricistaId: slot.eletricistaId,
            escalaSlotId: slot.id,
            motivoSistema: 'falta_abertura',
            status: 'pendente',
            createdBy: 'system',
          },
        }).catch(() => {});
        continue;
      }

      if (!equipesReais.has(params.equipePrevistaId)) {
        const equipeRealId = [...equipesReais][0];
        await prisma.divergenciaEscala.create({
          data: {
            dataReferencia: dataRef,
            equipePrevistaId: params.equipePrevistaId,
            equipeRealId,
            eletricistaId: slot.eletricistaId,
            tipo: 'equipe_divergente',
            detalhe: null,
            createdBy: params.executadoPor,
          },
        }).catch(() => {});
      }
    }
  }
}


