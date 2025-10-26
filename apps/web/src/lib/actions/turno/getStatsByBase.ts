/**
 * Server Action para Estatísticas de Turnos por Base
 *
 * Esta action recupera estatísticas sobre turnos do dia atual,
 * agrupados por base da equipe.
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '../common/actionHandler';
import { listBases } from '../base/list';
import { z } from 'zod';

const turnoStatsByBaseSchema = z.object({});

/**
 * Busca estatísticas de turnos do dia por base
 *
 * @returns Estatísticas de turnos agrupados por base
 */
export const getStatsByBase = async () =>
  handleServerAction(
    turnoStatsByBaseSchema,
    async () => {
      console.log('🔍 [getStatsByBase] Iniciando busca de dados...');

      // 1. Buscar todas as bases
      const resultBases = await listBases({
        page: 1,
        pageSize: 100,
        orderBy: 'nome',
        orderDir: 'asc',
      });

      if (!resultBases.success || !resultBases.data) {
        throw new Error('Erro ao buscar bases');
      }

      const bases = resultBases.data.data || [];
      console.log('✅ [getStatsByBase] Bases encontradas:', bases.length);

      // 2. Buscar turnos do dia com relacionamentos de equipe e base
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
              EquipeBaseHistorico: {
                where: {
                  dataFim: null,
                  deletedAt: null,
                },
                include: {
                  base: true,
                },
                take: 1,
              },
            },
          },
        },
      });

      console.log('✅ [getStatsByBase] Turnos encontrados:', turnos.length);

      // 3. Inicializar contagem para todas as bases com 0
      const contagem: Record<string, number> = {};
      bases.forEach((base: any) => {
        contagem[base.nome] = 0;
      });

      // 4. Contar turnos por base
      turnos.forEach((turno: any) => {
        const baseNome = turno.equipe?.EquipeBaseHistorico?.[0]?.base?.nome;
        if (baseNome && contagem[baseNome] !== undefined) {
          contagem[baseNome]++;
        }
      });

      console.log('🔢 [getStatsByBase] Contagem por base:', contagem);

      // 5. Converter para array formatado
      const dados = bases.map((base: any) => ({
        base: base.nome,
        quantidade: contagem[base.nome] || 0,
      }));

      console.log('📊 [getStatsByBase] Dados finais:', dados);

      return dados;
    },
    {},
    { entityName: 'Turno', actionType: 'get' }
  );
