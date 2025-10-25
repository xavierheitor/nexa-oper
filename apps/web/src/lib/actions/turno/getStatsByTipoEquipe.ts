/**
 * Server Action para Estatísticas de Turnos por Tipo de Equipe
 *
 * Esta action recupera estatísticas sobre turnos do dia atual,
 * agrupados por tipo de equipe.
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '../common/actionHandler';
import { listTiposEquipe } from '../tipoEquipe/list';
import { z } from 'zod';

const turnoStatsByTipoEquipeSchema = z.object({});

/**
 * Busca estatísticas de turnos do dia por tipo de equipe
 *
 * @returns Estatísticas de turnos agrupados por tipo de equipe
 */
export const getStatsByTipoEquipe = async () =>
  handleServerAction(
    turnoStatsByTipoEquipeSchema,
    async () => {
      console.log('🔍 [getStatsByTipoEquipe] Iniciando busca de dados...');

      // 1. Buscar todos os tipos de equipe
      console.log('📋 [getStatsByTipoEquipe] Buscando tipos de equipe...');
      const resultTipos = await listTiposEquipe({
        page: 1,
        pageSize: 100,
        orderBy: 'id',
        orderDir: 'asc',
      });

      console.log('📊 [getStatsByTipoEquipe] Resultado tipos:', {
        success: resultTipos.success,
        dataLength: resultTipos.data?.data?.length,
      });

      if (!resultTipos.success || !resultTipos.data) {
        console.error('❌ [getStatsByTipoEquipe] Erro ao buscar tipos de equipe');
        throw new Error('Erro ao buscar tipos de equipe');
      }

      const tiposEquipe = resultTipos.data.data || [];
      console.log('✅ [getStatsByTipoEquipe] Tipos encontrados:', tiposEquipe.length);
      console.log('📝 [getStatsByTipoEquipe] Tipos:', tiposEquipe.map((t: any) => t.nome));

      // 2. Buscar turnos do dia com relacionamentos de equipe
      const hoje = new Date();
      const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0);
      const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);

      console.log('📅 [getStatsByTipoEquipe] Buscando turnos de:', {
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
        include: {
          equipe: {
            include: {
              tipoEquipe: true,
            },
          },
        },
      });

      console.log('✅ [getStatsByTipoEquipe] Turnos encontrados:', turnos.length);

      // 3. Inicializar contagem para todos os tipos com 0
      const contagem: Record<string, number> = {};
      tiposEquipe.forEach((tipo: any) => {
        contagem[tipo.nome] = 0;
      });
      console.log('🔢 [getStatsByTipoEquipe] Contagem inicial:', contagem);

      // 4. Contar turnos por tipo de equipe
      turnos.forEach((turno: any) => {
        const tipoEquipeNome = turno.equipe?.tipoEquipe?.nome;
        console.log('🔍 [getStatsByTipoEquipe] Turno ID:', turno.id, 'Tipo:', tipoEquipeNome);
        if (tipoEquipeNome && contagem[tipoEquipeNome] !== undefined) {
          contagem[tipoEquipeNome]++;
        }
      });

      console.log('🔢 [getStatsByTipoEquipe] Contagem final:', contagem);

      // 5. Converter para array formatado
      const dados = tiposEquipe.map((tipo: any) => ({
        tipo: tipo.nome,
        quantidade: contagem[tipo.nome] || 0,
      }));

      console.log('📊 [getStatsByTipoEquipe] Dados finais:', dados);

      return dados;
    },
    {},
    { entityName: 'Turno', actionType: 'get' }
  );
