/**
 * Server Action para buscar localizações de um turno
 *
 * Retorna todas as localizações registradas para um turno específico,
 * ordenadas cronologicamente (da primeira à última).
 */

'use server';

import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';
import { prisma } from '../../db/db.service';

/**
 * Schema de validação para buscar localizações
 */
const getLocalizacoesSchema = z.object({
  turnoId: z.number().int().positive(),
});

/**
 * Busca localizações de um turno
 *
 * @param rawData - Dados com turnoId
 * @returns Lista de localizações ordenadas por data de captura
 */
export const getLocalizacoesTurno = async (rawData: unknown) =>
  handleServerAction(
    getLocalizacoesSchema,
    async (data) => {
      // ✅ Log para debug
      console.log('[getLocalizacoesTurno] Buscando localizações para turnoId:', data.turnoId);
      console.log('[getLocalizacoesTurno] Tipo do turnoId:', typeof data.turnoId);

      // Busca todas as localizações do turno, ordenadas por data de captura
      // ✅ Garantir que turnoId seja número
      const turnoId = Number(data.turnoId);
      console.log('[getLocalizacoesTurno] turnoId convertido:', turnoId);

      // ✅ Primeiro, verificar todas as localizações (incluindo deletadas) para debug
      const todasLocalizacoes = await prisma.mobileLocation.findMany({
        where: {
          turnoId: turnoId,
        },
        select: {
          id: true,
          turnoId: true,
          deletedAt: true,
          capturedAt: true,
        },
      });
      console.log('[getLocalizacoesTurno] Total de localizações no banco para turnoId', turnoId, ':', todasLocalizacoes.length);
      console.log('[getLocalizacoesTurno] Detalhes:', todasLocalizacoes);

      // Buscar apenas as não deletadas
      const localizacoes = await prisma.mobileLocation.findMany({
        where: {
          turnoId: turnoId,
          deletedAt: null, // Apenas localizações não deletadas
        },
        orderBy: {
          capturedAt: 'asc', // Ordem cronológica (primeira à última)
        },
        select: {
          id: true,
          latitude: true,
          longitude: true,
          accuracy: true,
          capturedAt: true,
          tagType: true,
          tagDetail: true,
        },
      });

      // ✅ Log para debug
      console.log('[getLocalizacoesTurno] Localizações encontradas (não deletadas):', localizacoes.length);
      if (localizacoes.length === 0 && todasLocalizacoes.length > 0) {
        console.log('[getLocalizacoesTurno] ⚠️ ATENÇÃO: Existem localizações mas todas estão deletadas!');
      } else if (localizacoes.length === 0) {
        console.log('[getLocalizacoesTurno] ⚠️ Nenhuma localização encontrada para turnoId:', turnoId);

        // Verificar se o turno existe
        const turnoExiste = await prisma.turno.findUnique({
          where: { id: turnoId },
          select: { id: true },
        });
        console.log('[getLocalizacoesTurno] Turno existe?', turnoExiste ? 'SIM' : 'NÃO');

        // Verificar todas as localizações no banco (para debug)
        const todasLocalizacoesGeral = await prisma.mobileLocation.findMany({
          take: 10,
          select: {
            id: true,
            turnoId: true,
            deletedAt: true,
          },
        });
        console.log('[getLocalizacoesTurno] Últimas 10 localizações no banco:', todasLocalizacoesGeral);
      }

      return {
        localizacoes,
        total: localizacoes.length,
      };
    },
    rawData,
    { entityName: 'MobileLocation', actionType: 'get' }
  );

