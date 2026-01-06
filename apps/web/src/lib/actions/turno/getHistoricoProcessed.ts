/**
 * Server Action: Buscar Histórico de Turnos Processado
 *
 * Esta action retorna dados de turnos já processados para a página de histórico,
 * movendo o processamento pesado do cliente para o servidor.
 *
 * FUNCIONALIDADES:
 * - Busca turnos do período especificado
 * - Processa e mapeia dados
 * - Calcula estatísticas
 * - Agrega dados por base
 * - Retorna dados prontos para uso
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { container } from '../../services/common/registerServices';
import { TurnoService } from '../../services/turnos/TurnoService';
import { z } from 'zod';

/**
 * Dados processados do histórico
 */
export interface HistoricoProcessedData {
  turnos: Array<{
    id: number;
    dataSolicitacao: Date;
    dataInicio: Date;
    dataFim: Date | null;
    veiculoId: number;
    veiculoPlaca: string;
    veiculoModelo: string;
    equipeId: number;
    equipeNome: string;
    tipoEquipeNome: string;
    baseNome: string;
    dispositivo: string | null;
    kmInicio: number | null;
    kmFim: number | null;
    status: 'ABERTO' | 'FECHADO';
    eletricistas: Array<{
      id: number;
      nome: string;
      matricula: string;
    }>;
  }>;
  stats: {
    total: number;
    totalAbertos: number;
    totalFechados: number;
    porBase: Record<string, number>;
  };
}

/**
 * Schema de validação para parâmetros
 */
const getHistoricoProcessedSchema = z.object({
  dataInicio: z.coerce.date(),
  dataFim: z.coerce.date(),
});

/**
 * Tipo para turno formatado pelo repositório
 * O repositório já formata e adiciona campos como veiculoPlaca, veiculoModelo, etc.
 */
type TurnoFormatted = {
  id: number;
  dataSolicitacao: Date;
  dataInicio: Date;
  dataFim: Date | null;
  veiculoId: number;
  equipeId: number;
  dispositivo: string | null;
  kmInicio: number;
  KmFim?: number | null; // Campo do Prisma (com K maiúsculo)
  kmFim?: number | null; // Campo mapeado (com k minúsculo)
  veiculoPlaca?: string;
  veiculoModelo?: string;
  equipeNome?: string;
  tipoEquipeNome?: string;
  baseNome?: string;
  eletricistas?: Array<{
    id: number;
    nome: string;
    matricula: string;
  }>;
};

/**
 * Busca histórico de turnos processado
 */
export async function getHistoricoProcessed(
  rawParams: unknown
): Promise<{ success: boolean; data?: HistoricoProcessedData; error?: string }> {
  return handleServerAction(
    getHistoricoProcessedSchema,
    async (params) => {
      const turnoService = container.get<TurnoService>('turnoService');

      // Buscar turnos do período
      const result = await turnoService.list({
        page: 1,
        pageSize: 1000,
        orderBy: 'dataInicio',
        orderDir: 'desc',
        dataInicio: params.dataInicio,
        dataFim: params.dataFim,
      });

      // Extrair array de turnos do resultado paginado
      const turnosArray = result.data || [];

      // Mapear para o tipo esperado, garantindo que campos opcionais estejam presentes
      const turnos: TurnoFormatted[] = turnosArray.map(turno => ({
        id: turno.id,
        dataSolicitacao: turno.dataSolicitacao,
        dataInicio: turno.dataInicio,
        dataFim: turno.dataFim,
        veiculoId: turno.veiculoId,
        equipeId: turno.equipeId,
        dispositivo: turno.dispositivo,
        kmInicio: turno.kmInicio,
        kmFim: (turno as { KmFim?: number | null }).KmFim ?? null, // Garantir que seja null, não undefined
        veiculoPlaca: (turno as { veiculoPlaca?: string }).veiculoPlaca,
        veiculoModelo: (turno as { veiculoModelo?: string }).veiculoModelo,
        equipeNome: (turno as { equipeNome?: string }).equipeNome,
        tipoEquipeNome: (turno as { tipoEquipeNome?: string }).tipoEquipeNome,
        baseNome: (turno as { baseNome?: string }).baseNome,
        eletricistas: (
          turno as {
            eletricistas?: Array<{
              id: number;
              nome: string;
              matricula: string;
            }>;
          }
        ).eletricistas,
      }));

      // Processar e mapear dados
      const turnosProcessados = turnos.map(turno => ({
        id: turno.id,
        dataSolicitacao: turno.dataSolicitacao,
        dataInicio: turno.dataInicio,
        dataFim: turno.dataFim,
        veiculoId: turno.veiculoId,
        veiculoPlaca: turno.veiculoPlaca || 'N/A',
        veiculoModelo: turno.veiculoModelo || 'N/A',
        equipeId: turno.equipeId,
        equipeNome: turno.equipeNome || 'N/A',
        tipoEquipeNome: turno.tipoEquipeNome || 'N/A',
        baseNome: turno.baseNome || 'N/A',
        dispositivo: turno.dispositivo,
        kmInicio: turno.kmInicio,
        kmFim: turno.kmFim ?? null, // Garantir que seja null, não undefined
        status: turno.dataFim ? ('FECHADO' as const) : ('ABERTO' as const),
        eletricistas:
          turno.eletricistas?.map(e => ({
            id: e.id,
            nome: e.nome,
            matricula: e.matricula,
          })) || [],
      }));

      // Calcular estatísticas
      const porBase: Record<string, number> = {};
      let totalAbertos = 0;
      let totalFechados = 0;

      turnos.forEach(turno => {
        const baseNome = turno.baseNome || 'Não identificada';
        const base = baseNome.split('-')[0] || baseNome;
        porBase[base] = (porBase[base] || 0) + 1;

        if (turno.dataFim) {
          totalFechados++;
        } else {
          totalAbertos++;
        }
      });

      return {
        turnos: turnosProcessados,
        stats: {
          total: turnos.length,
          totalAbertos,
          totalFechados,
          porBase,
        },
      };
    },
    rawParams,
    { entityName: 'Histórico de Turnos', actionType: 'list' }
  );
}
