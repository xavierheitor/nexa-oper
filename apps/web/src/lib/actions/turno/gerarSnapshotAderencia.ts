/**
 * Server Action para gerar snapshot diário de aderência de escala
 *
 * Esta action gera um snapshot do estado atual de aderência dos turnos previstos
 * e armazena no banco para consulta histórica.
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '../common/actionHandler';
import { z } from 'zod';
import { getTurnosPrevistosHoje } from './getTurnosPrevistos';
import type { TurnoPrevisto } from '@/lib/types/turnoPrevisto';

const gerarSnapshotSchema = z.object({
  dataReferencia: z.coerce.date().optional(), // Se não fornecido, usa hoje
  geradoPor: z.string().optional().default('sistema'), // Quem gerou o snapshot
  horarioLimite: z.string().optional(), // Horário limite (HH:MM:SS) - se null, considera todo o dia
});

/**
 * Gera snapshot de aderência para uma data específica (ou hoje)
 *
 * @param rawData - Data de referência opcional e quem gerou
 * @returns Resultado da geração do snapshot
 */
export const gerarSnapshotAderencia = async (rawData: unknown) =>
  handleServerAction(
    gerarSnapshotSchema,
    async (data) => {
      // Determinar data de referência
      const dataReferencia = data.dataReferencia || new Date();
      dataReferencia.setHours(0, 0, 0, 0);

      // Buscar turnos previstos para a data
      // Como getTurnosPrevistosHoje sempre busca hoje, precisamos adaptar
      // Por enquanto, vamos gerar apenas para hoje (pode ser expandido depois)
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      if (dataReferencia.getTime() !== hoje.getTime()) {
        throw new Error(
          'Por enquanto, só é possível gerar snapshot para hoje. Suporte a datas passadas será implementado em breve.'
        );
      }

      // Buscar turnos previstos (com horário limite se fornecido)
      // Por enquanto, vamos buscar todos e filtrar depois
      // TODO: Otimizar para buscar apenas até o horário limite
      const result = await getTurnosPrevistosHoje();
      if (!result.success || !result.data) {
        throw new Error('Erro ao buscar turnos previstos');
      }

      let turnosPrevistos: TurnoPrevisto[] = result.data;

      // Se houver horário limite, filtrar turnos abertos após esse horário
      if (data.horarioLimite) {
        const [hours, minutes, seconds] = data.horarioLimite.split(':').map(Number);
        const horarioLimiteDate = new Date(dataReferencia);
        horarioLimiteDate.setHours(hours, minutes, seconds || 0, 0);

        turnosPrevistos = turnosPrevistos.map((turno) => {
          // Se o turno foi aberto após o horário limite, considerar como não aberto
          if (turno.dataAbertura && turno.dataAbertura > horarioLimiteDate) {
            return {
              ...turno,
              status: 'NAO_ABERTO' as const,
              turnoId: undefined,
              dataAbertura: undefined,
              diferencaMinutos: undefined,
            };
          }
          return turno;
        });
      }

      // Buscar escalaEquipePeriodoId para cada equipe
      // Buscar todas as escalas válidas de hoje para mapear equipe -> escala
      // Se uma equipe tem múltiplas escalas, pegar a mais recente (maior ID ou mais recente)
      const hojeFim = new Date(hoje);
      hojeFim.setHours(23, 59, 59, 999);

      const escalasValidas = await prisma.escalaEquipePeriodo.findMany({
        where: {
          status: 'PUBLICADA',
          periodoInicio: { lte: hojeFim },
          periodoFim: { gte: hoje },
          deletedAt: null,
        },
        select: {
          id: true,
          equipeId: true,
          periodoInicio: true,
        },
        orderBy: {
          periodoInicio: 'desc', // Pegar a mais recente
        },
      });

      // Mapear equipe -> escala (pegar a mais recente se houver múltiplas)
      const escalaPorEquipe = new Map<number, number>();
      escalasValidas.forEach((escala) => {
        if (!escalaPorEquipe.has(escala.equipeId)) {
          escalaPorEquipe.set(escala.equipeId, escala.id);
        }
      });

      // Gerar snapshots para cada turno previsto
      const snapshots = await Promise.all(
        turnosPrevistos.map(async (turno) => {
          // Verificar se já existe snapshot para esta equipe nesta data
          const snapshotExistente = await prisma.aderenciaEscalaSnapshot.findUnique({
            where: {
              equipeId_dataReferencia: {
                equipeId: turno.equipeId,
                dataReferencia: dataReferencia,
              },
            },
          });

          // Preparar dados do snapshot
          const dadosSnapshot = {
            dataReferencia,
            equipeId: turno.equipeId,
            tipoEquipeId: turno.tipoEquipeId,
            tipoEquipeNome: turno.tipoEquipeNome,
            escalaEquipePeriodoId: escalaPorEquipe.get(turno.equipeId) || null,
            horarioPrevisto: turno.horarioPrevisto,
            eletricistasPrevistosIds: JSON.stringify(
              turno.eletricistas.map((e) => e.id)
            ),
            status: turno.status,
            turnoId: turno.turnoId || null,
            dataAbertura: turno.dataAbertura || null,
            diferencaMinutos: turno.diferencaMinutos || null,
            geradoEm: new Date(),
            geradoPor: data.geradoPor,
            createdAt: new Date(),
            createdBy: data.geradoPor,
          };

          // Se já existe, atualizar; senão, criar
          if (snapshotExistente) {
            return prisma.aderenciaEscalaSnapshot.update({
              where: { id: snapshotExistente.id },
              data: dadosSnapshot,
            });
          } else {
            return prisma.aderenciaEscalaSnapshot.create({
              data: dadosSnapshot,
            });
          }
        })
      );

      return {
        totalGerados: snapshots.length,
        dataReferencia,
        snapshots: snapshots.map((s) => ({
          id: s.id,
          equipeId: s.equipeId,
          status: s.status,
        })),
      };
    },
    rawData,
    { entityName: 'AderenciaEscalaSnapshot', actionType: 'create' }
  );

