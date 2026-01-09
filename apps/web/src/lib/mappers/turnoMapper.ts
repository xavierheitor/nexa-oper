import { TurnoData } from '../types/turno-frontend';

/**
 * Maps a raw Turno object (from API/Repository) to the frontend TurnoData shape.
 *
 * @param turno - The raw turno object (usually from Prisma or API response)
 * @returns TurnoData object formatted for the frontend
 */
export function mapTurnoToTurnoData(turno: any): TurnoData {
  return {
    id: turno.id,
    dataSolicitacao:
      turno.dataSolicitacao instanceof Date
        ? turno.dataSolicitacao.toISOString()
        : String(turno.dataSolicitacao),
    dataInicio:
      turno.dataInicio instanceof Date
        ? turno.dataInicio.toISOString()
        : String(turno.dataInicio),
    dataFim: turno.dataFim
      ? turno.dataFim instanceof Date
        ? turno.dataFim.toISOString()
        : String(turno.dataFim)
      : undefined,
    veiculoId: turno.veiculoId,
    veiculoPlaca: (turno as { veiculoPlaca?: string }).veiculoPlaca || 'N/A',
    veiculoModelo: (turno as { veiculoModelo?: string }).veiculoModelo || 'N/A',
    equipeId: turno.equipeId,
    equipeNome: (turno as { equipeNome?: string }).equipeNome || 'N/A',
    tipoEquipeNome:
      (turno as { tipoEquipeNome?: string }).tipoEquipeNome || 'N/A',
    baseNome: (turno as { baseNome?: string }).baseNome || 'N/A',
    dispositivo: turno.dispositivo || '',
    kmInicio: turno.kmInicio || 0,
    kmFim: (turno as { KmFim?: number | null }).KmFim ?? undefined,
    status: turno.dataFim ? 'FECHADO' : 'ABERTO',
    eletricistas: (
      (
        turno as {
          eletricistas?: Array<{
            id: number;
            nome: string;
            matricula: string;
            motorista?: boolean;
          }>;
        }
      ).eletricistas || []
    ).map(e => ({
      id: e.id,
      nome: e.nome,
      matricula: e.matricula,
      motorista: e.motorista || false,
    })),
  };
}
