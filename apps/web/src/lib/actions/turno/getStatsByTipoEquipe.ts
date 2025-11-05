/**
 * Server Action para Estatísticas de Turnos por Tipo de Equipe
 *
 * Esta action recupera estatísticas sobre turnos do dia atual,
 * agrupados por tipo de equipe.
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '../common/actionHandler';
import { listTiposEquipe } from '../tipoEquipe/list';
import { getTodayDateRange } from '@/lib/utils/dateHelpers';
import { z } from 'zod';

const turnoStatsByTipoEquipeSchema = z.object({});

/**
 * Busca estatísticas de turnos do dia por tipo de equipe
 *
 * @returns Estatísticas de turnos agrupados por tipo de equipe
 */
export const getStatsByTipoEquipe = async () =>
  handleServerAction(
    turnoStatsByTipoEquipeSchema,
    async () => {
      // 1. Buscar todos os tipos de equipe
      const resultTipos = await listTiposEquipe({
        page: 1,
        pageSize: 100,
        orderBy: 'id',
        orderDir: 'asc',
      });

      if (!resultTipos.success || !resultTipos.data) {
        // Erro será tratado pelo handleServerAction
        throw new Error('Erro ao buscar tipos de equipe');
      }

      const tiposEquipe = resultTipos.data.data || [];

      // 2. Buscar turnos do dia com relacionamentos de equipe
      const { inicio, fim } = getTodayDateRange();

      const turnos = await prisma.turno.findMany({
        where: {
          deletedAt: null,
          dataInicio: {
            gte: inicio,
            lte: fim,
          },
        },
        include: {
          equipe: {
            include: {
              tipoEquipe: true,
            },
          },
        },
      });

      // 3. Inicializar contagem para todos os tipos com 0
      const contagem: Record<string, number> = {};
      tiposEquipe.forEach((tipo: any) => {
        contagem[tipo.nome] = 0;
      });

      // 4. Contar turnos por tipo de equipe
      turnos.forEach((turno: any) => {
        const tipoEquipeNome = turno.equipe?.tipoEquipe?.nome;
        if (tipoEquipeNome && contagem[tipoEquipeNome] !== undefined) {
          contagem[tipoEquipeNome]++;
        }
      });

      // 5. Converter para array formatado
      const dados = tiposEquipe.map((tipo: any) => ({
        tipo: tipo.nome,
        quantidade: contagem[tipo.nome] || 0,
      }));

      return dados;
    },
    {},
    { entityName: 'Turno', actionType: 'get' }
  );
