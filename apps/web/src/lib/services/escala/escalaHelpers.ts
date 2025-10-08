/**
 * Helpers Utilitários para Escalas
 *
 * Implementa funções auxiliares para cálculos de padrões de escala,
 * horários vigentes e membros de equipe.
 */

import {
  TipoEscala,
  TipoEscalaCicloPosicao,
  TipoEscalaSemanaMascara,
  EquipeHorarioVigencia,
  Eletricista,
} from '@nexa-oper/db';
import { prisma } from '../../db/db.service';

/**
 * Mapa de dias da semana para índices JavaScript Date
 */
const DiaSemanaMap = {
  DOMINGO: 0,
  SEGUNDA: 1,
  TERCA: 2,
  QUARTA: 3,
  QUINTA: 4,
  SEXTA: 5,
  SABADO: 6,
};

/**
 * Resolve o status do dia (TRABALHO ou FOLGA) baseado no tipo de escala
 *
 * @param tipoEscala - Tipo de escala com ciclos ou máscaras
 * @param data - Data para resolver o status
 * @param dataInicioPeriodo - Data de início do período (para cálculo de ciclo)
 * @returns 'TRABALHO' ou 'FOLGA'
 */
export function resolveStatusDoDia(
  tipoEscala: TipoEscala & {
    CicloPosicoes: TipoEscalaCicloPosicao[];
    SemanaMascaras: TipoEscalaSemanaMascara[];
  },
  data: Date,
  dataInicioPeriodo: Date
): 'TRABALHO' | 'FOLGA' {
  if (tipoEscala.modoRepeticao === 'CICLO_DIAS') {
    // Cálculo baseado em ciclo de dias
    const cicloDias = tipoEscala.cicloDias || 1;
    const diffMs = data.getTime() - dataInicioPeriodo.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const posicaoCiclo = (diffDays % cicloDias) + 1; // Posição 1..N

    const posicao = tipoEscala.CicloPosicoes.find(
      p => p.posicao === posicaoCiclo
    );

    if (posicao) {
      return posicao.status === 'TRABALHO' ? 'TRABALHO' : 'FOLGA';
    }

    // Default para FOLGA se não encontrar configuração
    return 'FOLGA';
  }

  if (tipoEscala.modoRepeticao === 'SEMANA_DEPENDENTE') {
    // Cálculo baseado em semanas e dia da semana
    const periodicidade = tipoEscala.periodicidadeSemanas || 1;
    const diffMs = data.getTime() - dataInicioPeriodo.getTime();
    const diffWeeks = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
    const semanaIndex = diffWeeks % periodicidade;

    const diaSemanaJs = data.getDay(); // 0 = Domingo, 1 = Segunda, ...
    const diaSemanaEnum = Object.entries(DiaSemanaMap).find(
      ([_, valor]) => valor === diaSemanaJs
    )?.[0] as keyof typeof DiaSemanaMap | undefined;

    if (!diaSemanaEnum) {
      return 'FOLGA';
    }

    const mascara = tipoEscala.SemanaMascaras.find(
      m => m.semanaIndex === semanaIndex && m.dia === diaSemanaEnum
    );

    if (mascara) {
      return mascara.status === 'TRABALHO' ? 'TRABALHO' : 'FOLGA';
    }

    // Default para FOLGA se não encontrar configuração
    return 'FOLGA';
  }

  // Caso nenhum modo seja reconhecido
  return 'FOLGA';
}

/**
 * Busca o horário vigente para uma equipe em uma data específica
 *
 * @param equipeId - ID da equipe
 * @param data - Data para buscar o horário
 * @returns Objeto com inicio (HH:MM:SS) e fim (HH:MM:SS) ou null se não encontrado
 */
export async function horarioVigente(
  equipeId: number,
  data: Date
): Promise<{ inicio: string; fim: string } | null> {
  const vigencia = await prisma.equipeHorarioVigencia.findFirst({
    where: {
      equipeId,
      vigenciaInicio: { lte: data },
      OR: [{ vigenciaFim: null }, { vigenciaFim: { gte: data } }],
      deletedAt: null,
    },
    orderBy: {
      vigenciaInicio: 'desc',
    },
  });

  if (!vigencia) {
    return null;
  }

  // Calcular horário de fim baseado em duracaoHoras
  const [horaInicio, minutoInicio] = vigencia.inicioTurnoHora
    .split(':')
    .map(Number);
  const duracaoHoras = parseFloat(vigencia.duracaoHoras.toString());

  const dataInicio = new Date();
  dataInicio.setHours(horaInicio, minutoInicio, 0, 0);

  const dataFim = new Date(dataInicio);
  dataFim.setHours(dataFim.getHours() + Math.floor(duracaoHoras));
  dataFim.setMinutes(
    dataFim.getMinutes() + Math.round((duracaoHoras % 1) * 60)
  );

  const fim = `${String(dataFim.getHours()).padStart(2, '0')}:${String(dataFim.getMinutes()).padStart(2, '0')}:00`;

  return {
    inicio: vigencia.inicioTurnoHora,
    fim,
  };
}

/**
 * Retorna os eletricistas vigentes de uma equipe em um período
 *
 * @param equipeId - ID da equipe
 * @param inicio - Data de início do período
 * @param fim - Data de fim do período
 * @returns Array de eletricistas do mesmo contrato da equipe
 */
export async function membrosVigentes(
  equipeId: number,
  inicio: Date,
  fim: Date
): Promise<
  Array<{
    id: number;
    nome: string;
    matricula: string;
  }>
> {
  // Buscar a equipe para obter o contratoId
  const equipe = await prisma.equipe.findUnique({
    where: { id: equipeId },
    select: { contratoId: true },
  });

  if (!equipe) {
    return [];
  }

  // Buscar eletricistas do mesmo contrato que não foram deletados
  const eletricistas = await prisma.eletricista.findMany({
    where: {
      contratoId: equipe.contratoId,
      deletedAt: null,
    },
    select: {
      id: true,
      nome: true,
      matricula: true,
    },
    orderBy: {
      nome: 'asc',
    },
  });

  return eletricistas;
}

/**
 * Calcula a data normalizada (00:00:00 UTC)
 *
 * @param data - Data a normalizar
 * @returns Data normalizada
 */
export function normalizarData(data: Date): Date {
  const normalized = new Date(data);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized;
}

/**
 * Calcula quantos dias de diferença entre duas datas
 *
 * @param dataInicio - Data inicial
 * @param dataFim - Data final
 * @returns Número de dias de diferença
 */
export function calcularDiasDiferenca(
  dataInicio: Date,
  dataFim: Date
): number {
  const diffMs = dataFim.getTime() - dataInicio.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

