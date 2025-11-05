/**
 * Server Action para Estatísticas de Turnos por Hora e Tipo de Equipe
 *
 * Esta action recupera estatísticas sobre turnos do dia atual,
 * agrupados por hora e tipo de equipe para gráfico de barras agrupadas.
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '../common/actionHandler';
import { listTiposEquipe } from '../tipoEquipe/list';
import { z } from 'zod';

const turnoStatsByHoraETipoEquipeSchema = z.object({});

/**
 * Busca estatísticas de turnos do dia por hora e tipo de equipe
 *
 * @returns Estatísticas de turnos agrupados por hora e tipo de equipe
 */
export const getStatsByHoraETipoEquipe = async () =>
  handleServerAction(
    turnoStatsByHoraETipoEquipeSchema,
    async () => {
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

      // 2. Buscar turnos do dia com relacionamentos
      const hoje = new Date();
      const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0);
      const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);

      const turnos = await prisma.turno.findMany({
        where: {
          deletedAt: null,
          dataInicio: {
            gte: inicioHoje,
            lte: fimHoje,
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
        const hora = dataInicio.getHours();
        const minutos = dataInicio.getMinutes();

        // Arredondar com tolerância de 15 minutos
        let horaFinal = hora;
        if (minutos >= 45) {
          horaFinal = (hora + 1) % 24;
        }

        const tipoEquipeNome = turno.equipe?.tipoEquipe?.nome || 'Sem classificação';

        if (contagem[horaFinal] && contagem[horaFinal][tipoEquipeNome] !== undefined) {
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
    {},
    { entityName: 'Turno', actionType: 'get' }
  );
