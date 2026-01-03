/**
 * Server Action para Executar Reconciliação Diária
 *
 * Executa reconciliação automática para todas as equipes com escala publicada
 * em um período específico (padrão: últimos 30 dias)
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { reconciliarDiaEquipeInterna } from './reconciliarDiaEquipe';

export interface ExecutarReconciliacaoDiariaParams {
  diasHistorico?: number; // Padrão: 30
  dataReferencia?: Date; // Se não fornecido, usa hoje
}

/**
 * Executa reconciliação diária para todas as equipes com escala publicada
 */
export async function executarReconciliacaoDiaria(
  params: ExecutarReconciliacaoDiariaParams = {}
): Promise<{
  diasProcessados: number;
  equipesProcessadas: number;
  erros: Array<{ equipe: number; data: string; erro: string }>;
}> {
  const agora = params.dataReferencia || new Date();
  const diasParaProcessar = params.diasHistorico || parseInt(
    process.env.RECONCILIACAO_DIAS_HISTORICO || '30',
    10
  );

  // Calcular período (últimos N dias)
  const dataFim = new Date(agora);
  dataFim.setHours(23, 59, 59, 999);
  const dataInicio = new Date(agora);
  dataInicio.setDate(dataInicio.getDate() - diasParaProcessar);
  dataInicio.setHours(0, 0, 0, 0);

  console.log(
    `[Reconciliação Diária] Período: ${dataInicio.toISOString().split('T')[0]} até ${dataFim.toISOString().split('T')[0]}`
  );

  // Buscar todas as equipes que têm escala ativa no período
  const equipesComEscala = await prisma.escalaEquipePeriodo.findMany({
    where: {
      periodoInicio: { lte: dataFim },
      periodoFim: { gte: dataInicio },
      status: 'PUBLICADA',
    },
    select: {
      equipeId: true,
    },
    distinct: ['equipeId'],
  });

  console.log(`[Reconciliação Diária] Encontradas ${equipesComEscala.length} equipes com escala no período`);

  let diasProcessados = 0;
  let equipesProcessadas = 0;
  const erros: Array<{ equipe: number; data: string; erro: string }> = [];

  // Processar cada equipe
  for (const escalaEquipe of equipesComEscala) {
    const equipeId = escalaEquipe.equipeId;

    // Para cada dia do período, verificar se precisa reconciliar
    const dataAtual = new Date(dataInicio);
    while (dataAtual <= dataFim) {
      const dataStr = dataAtual.toISOString().split('T')[0];

      try {
        // Verificar se há slots de escala neste dia para esta equipe
        const dataAtualInicio = new Date(dataAtual);
        dataAtualInicio.setHours(0, 0, 0, 0);
        const dataAtualFim = new Date(dataAtual);
        dataAtualFim.setHours(23, 59, 59, 999);

        const slotsNoDia = await prisma.slotEscala.findFirst({
          where: {
            data: {
              gte: dataAtualInicio,
              lte: dataAtualFim,
            },
            escalaEquipePeriodo: {
              equipeId,
              status: 'PUBLICADA',
            },
          },
          select: { id: true },
        });

        // Se há slots, reconciliar o dia
        if (slotsNoDia) {
          // Verificar margem de 30 minutos para cada slot
          const slots = await prisma.slotEscala.findMany({
            where: {
              data: {
                gte: dataAtualInicio,
                lte: dataAtualFim,
              },
              escalaEquipePeriodo: {
                equipeId,
                status: 'PUBLICADA',
              },
              estado: 'TRABALHO',
            },
            include: {
              eletricista: {
                include: {
                  Status: true,
                },
              },
            },
          });

          // Verificar se já passou a margem de 30 minutos para cada slot
          let podeReconciliar = true;
          for (const slot of slots) {
            if (slot.inicioPrevisto) {
              const [hora, minuto] = slot.inicioPrevisto.split(':').map(Number);
              const horarioPrevisto = new Date(dataAtual);
              horarioPrevisto.setHours(hora, minuto, 0, 0);

              const horarioLimite = new Date(horarioPrevisto);
              horarioLimite.setMinutes(horarioLimite.getMinutes() + 30);

              // Se ainda não passou o horário limite, não reconciliar este dia ainda
              if (agora < horarioLimite) {
                podeReconciliar = false;
                break;
              }
            }
          }

          if (podeReconciliar) {
            try {
              await reconciliarDiaEquipeInterna({
                dataReferencia: dataStr,
                equipePrevistaId: equipeId,
                executadoPor: 'sistema-scheduler',
              });
              diasProcessados++;
            } catch (error) {
              // Erro já será logado pela função interna
              throw error;
            }
          }
        }

        // Avançar para próximo dia
        dataAtual.setDate(dataAtual.getDate() + 1);
      } catch (error) {
        const erroMsg = error instanceof Error ? error.message : String(error);
        erros.push({
          equipe: equipeId,
          data: dataStr,
          erro: erroMsg,
        });
        console.warn(
          `[Reconciliação Diária] ⚠️ Erro ao reconciliar equipe ${equipeId} em ${dataStr}: ${erroMsg}`
        );
        // Avançar para próximo dia mesmo em caso de erro
        dataAtual.setDate(dataAtual.getDate() + 1);
      }
    }

    equipesProcessadas++;
  }

  console.log(
    `[Reconciliação Diária] ✅ Reconciliação diária concluída: ${diasProcessados} dias processados, ${equipesProcessadas} equipes, ${erros.length} erros`
  );

  if (erros.length > 0) {
    console.warn(`[Reconciliação Diária] Erros encontrados: ${JSON.stringify(erros)}`);
  }

  return {
    diasProcessados,
    equipesProcessadas,
    erros,
  };
}

