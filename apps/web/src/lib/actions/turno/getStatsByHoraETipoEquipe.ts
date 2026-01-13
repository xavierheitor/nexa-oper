/**
 * Server Action para Estatísticas de Turnos por Hora e Tipo de Equipe
 *
 * Esta action recupera estatísticas sobre turnos de uma data específica,
 * agrupados por hora e tipo de equipe para gráfico de barras agrupadas.
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '../common/actionHandler';
import { listTiposEquipe } from '../tipoEquipe/list';
import {
  getDateRangeInSaoPaulo,
  getHoursInSaoPaulo,
  getMinutesInSaoPaulo,
} from '@/lib/utils/dateHelpers';
import { z } from 'zod';

const turnoStatsByHoraETipoEquipeSchema = z.object({
  date: z.string().optional(),
});

/**
 * Busca estatísticas de turnos do dia por hora e tipo de equipe
 *
 * @param params Objeto contendo a data opcional
 * @returns Estatísticas de turnos agrupados por hora e tipo de equipe
 */
export const getStatsByHoraETipoEquipe = async (
  params: { date?: string | Date } = {}
) =>
  handleServerAction(
    turnoStatsByHoraETipoEquipeSchema,
    async () => {
      const dateToUse = params.date ? new Date(params.date) : new Date();
      const { inicio, fim } = getDateRangeInSaoPaulo(dateToUse);

      // 1. Buscar tipos de equipe
      const resultTipos = await listTiposEquipe({
        page: 1,
        pageSize: 100,
        orderBy: 'id',
        orderDir: 'asc',
      });

      if (!resultTipos.success || !resultTipos.data) {
        throw new Error('Erro ao buscar tipos de equipe');
      }

      const tiposEquipe = resultTipos.data.data || [];

      // 2. Buscar turnos do dia com relacionamentos (Selecionando apenas campos necessários)
      const turnos = await prisma.turno.findMany({
        where: {
          deletedAt: null,
          dataInicio: {
            gte: inicio,
            lte: fim,
          },
        },
        select: {
          dataInicio: true,
          equipe: {
            select: {
              tipoEquipe: {
                select: {
                  nome: true,
                },
              },
            },
          },
        },
      });

      // 3. Inicializar estrutura de contagem: hora -> tipo -> quantidade
      const contagem: Record<number, Record<string, number>> = {};
      for (let i = 0; i < 24; i++) {
        contagem[i] = {};
        tiposEquipe.forEach((tipo: any) => {
          contagem[i][tipo.nome] = 0;
        });
      }

      // 4. Contar turnos por hora e tipo de equipe
      turnos.forEach((turno: any) => {
        const dataInicio = new Date(turno.dataInicio);
        // Usar timezone de São Paulo para extrair hora e minutos
        const hora = getHoursInSaoPaulo(dataInicio);
        const minutos = getMinutesInSaoPaulo(dataInicio);

        // Arredondar com tolerância de 15 minutos
        let horaFinal = hora;
        if (minutos >= 45) {
          horaFinal = (hora + 1) % 24;
        }

        const tipoEquipeNome =
          turno.equipe?.tipoEquipe?.nome || 'Sem classificação';

        if (
          contagem[horaFinal] &&
          contagem[horaFinal][tipoEquipeNome] !== undefined
        ) {
          contagem[horaFinal][tipoEquipeNome]++;
        }
      });

      // 5. Converter para formato compatível com gráfico de barras agrupadas
      const dados: any[] = [];

      for (let hora = 0; hora < 24; hora++) {
        tiposEquipe.forEach((tipo: any) => {
          dados.push({
            hora: hora.toString(),
            tipo: tipo.nome,
            quantidade: contagem[hora][tipo.nome] || 0,
          });
        });
      }

      return dados;
    },
    {
      date:
        params.date instanceof Date ? params.date.toISOString() : params.date,
    },
    { entityName: 'Turno', actionType: 'get' }
  );
