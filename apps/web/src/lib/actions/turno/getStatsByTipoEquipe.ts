/**
 * Server Action para Estatísticas de Turnos por Tipo de Equipe
 *
 * Esta action recupera estatísticas sobre turnos de uma data específica,
 * agrupados por tipo de equipe.
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '../common/actionHandler';
import { listTiposEquipe } from '../tipoEquipe/list';
import { getDateRangeInSaoPaulo } from '@/lib/utils/dateHelpers';
import { z } from 'zod';

const turnoStatsByTipoEquipeSchema = z.object({
  date: z.string().optional(), // Data em formato ISO ou string compatível
});

/**
 * Busca estatísticas de turnos do dia por tipo de equipe
 *
 * @param params Objeto contendo a data opcional
 * @returns Estatísticas de turnos agrupados por tipo de equipe
 */
export const getStatsByTipoEquipe = async (
  params: { date?: string | Date } = {}
) =>
  handleServerAction(
    turnoStatsByTipoEquipeSchema,
    async () => {
      const dateToUse = params.date ? new Date(params.date) : new Date();
      const { inicio, fim } = getDateRangeInSaoPaulo(dateToUse);

      // 1. Buscar todos os tipos de equipe para garantir que todos apareçam no gráfico
      const resultTipos = await listTiposEquipe({
        page: 1,
        pageSize: 100, // Assumindo que não haverá mais de 100 tipos
        orderBy: 'id',
        orderDir: 'asc',
      });

      if (!resultTipos.success || !resultTipos.data) {
        throw new Error('Erro ao buscar tipos de equipe');
      }

      const tiposEquipe = resultTipos.data.data || [];

      // 2. Usar agregação do Prisma para contar turnos por tipo de equipe
      const turnosAgrupados = await prisma.turno.groupBy({
        by: ['equipeId'],
        where: {
          deletedAt: null,
          dataInicio: {
            gte: inicio,
            lte: fim,
          },
        },
        _count: {
          id: true,
        },
      });

      // 3. Precisamos mapear equipeId para tipoEquipeId
      // Como o groupBy do Prisma não faz join, precisamos buscar as equipes envolvidas
      const equipeIds = turnosAgrupados.map(t => t.equipeId);

      const equipes = await prisma.equipe.findMany({
        where: {
          id: { in: equipeIds },
        },
        select: {
          id: true,
          tipoEquipeId: true,
        },
      });

      // Mapa de EquipeID -> TipoEquipeID
      const equipeTipoMap = new Map(equipes.map(e => [e.id, e.tipoEquipeId]));

      // 4. Agregar contagens por Tipo de Equipe
      const contagem: Record<string, number> = {};

      // Inicializar com 0
      tiposEquipe.forEach((tipo: any) => {
        contagem[tipo.nome] = 0;
      });

      turnosAgrupados.forEach(item => {
        const tipoEquipeId = equipeTipoMap.get(item.equipeId);
        if (tipoEquipeId) {
          const tipo = tiposEquipe.find((t: any) => t.id === tipoEquipeId);
          if (tipo) {
            contagem[tipo.nome] = (contagem[tipo.nome] || 0) + item._count.id;
          }
        }
      });

      // 5. Converter para array formatado
      const dados = tiposEquipe.map((tipo: any) => ({
        tipo: tipo.nome,
        quantidade: contagem[tipo.nome] || 0,
      }));

      return dados;
    },
    {
      date:
        params.date instanceof Date ? params.date.toISOString() : params.date,
    }, // Passar params para validação
    { entityName: 'Turno', actionType: 'get' }
  );
