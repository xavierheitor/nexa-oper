import { AberturaTurno, AberturasPorEletricistaMap } from './types';

export function agruparAberturasPorEletricista(
  aberturas: AberturaTurno[]
): AberturasPorEletricistaMap {
  const map: AberturasPorEletricistaMap = new Map();
  for (const abertura of aberturas) {
    const eid = abertura.eletricistaId;
    if (!map.has(eid)) {
      map.set(eid, { equipes: new Set(), itens: [] });
    }
    const entry = map.get(eid)!;
    entry.equipes.add(abertura.turnoRealizado.equipeId);
    entry.itens.push(abertura);
  }
  return map;
}

export function calcularHorasTrabalhadas(
  abertoEm: Date,
  fechadoEm: Date | null
): number {
  if (!fechadoEm) {
    const agora = new Date();
    return (agora.getTime() - abertoEm.getTime()) / (1000 * 60 * 60);
  }
  return (fechadoEm.getTime() - abertoEm.getTime()) / (1000 * 60 * 60);
}
