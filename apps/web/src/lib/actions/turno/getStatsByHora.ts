/**
 * Server Action para Estatísticas de Turnos por Hora
 *
 * Esta action recupera estatísticas sobre turnos do dia atual,
 * agrupados por hora de abertura (com tolerância de 15 minutos).
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '../common/actionHandler';
import { z } from 'zod';

const turnoStatsByHoraSchema = z.object({});

/**
 * Busca estatísticas de turnos do dia por hora
 *
 * @returns Estatísticas de turnos agrupados por hora (0-23)
 */
export const getStatsByHora = async () =>
  handleServerAction(
    turnoStatsByHoraSchema,
    async () => {
      console.log('🔍 [getStatsByHora] Iniciando busca de dados...');

      // Buscar turnos do dia
      const hoje = new Date();
      const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0);
      const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);

      console.log('📅 [getStatsByHora] Buscando turnos de:', {
        inicio: inicioHoje.toISOString(),
        fim: fimHoje.toISOString(),
      });

      const turnos = await prisma.turno.findMany({
        where: {
          deletedAt: null,
          dataInicio: {
            gte: inicioHoje,
            lte: fimHoje,
          },
        },
        select: {
          id: true,
          dataInicio: true,
        },
      });

      console.log('✅ [getStatsByHora] Turnos encontrados:', turnos.length);

      // Inicializar contagem para todas as 24 horas (0-23)
      const contagem: Record<number, number> = {};
      for (let i = 0; i < 24; i++) {
        contagem[i] = 0;
      }

      // Contar turnos por hora com tolerância de 15 minutos
      turnos.forEach((turno) => {
        const dataInicio = new Date(turno.dataInicio);
        const hora = dataInicio.getHours();
        const minutos = dataInicio.getMinutes();

        // Se minutos >= 45, arredonda para próxima hora
        // Se minutos < 15, considera a hora atual
        // Se 15 <= minutos < 45, considera a hora atual
        let horaFinal = hora;

        if (minutos >= 15 && minutos < 45) {
          // Entre 15 e 44 minutos, arredonda para a hora atual
          horaFinal = hora;
        } else if (minutos >= 45) {
          // 45 ou mais minutos, arredonda para próxima hora
          horaFinal = (hora + 1) % 24;
        } else {
          // 0-14 minutos, considera a hora atual
          horaFinal = hora;
        }

        contagem[horaFinal]++;
        console.log(`🕐 [getStatsByHora] Turno ${turno.id}: ${dataInicio.toLocaleTimeString('pt-BR')} → Hora ${horaFinal}:00`);
      });

      console.log('🔢 [getStatsByHora] Contagem por hora:', contagem);

      // Converter para array formatado
      const dados = Object.entries(contagem).map(([hora, quantidade]) => ({
        hora: hora.toString(),
        quantidade,
      }));

      console.log('📊 [getStatsByHora] Dados finais:', dados);

      return dados;
    },
    {},
    { entityName: 'Turno', actionType: 'get' }
  );
