/**
 * Server Action para criar eletricistas em lote
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { eletricistaLoteSchema } from '@/lib/schemas/eletricistaSchema';
import { prisma } from '@/lib/db/db.service';
import { StatusEletricista } from '@nexa-oper/db';

export const createEletricistasLote = async (rawData: unknown) =>
  handleServerAction(
    eletricistaLoteSchema,
    async (data, session) => {
      // Status inicial para todos os eletricistas (padrão: ATIVO)
      const statusInicial = (data.status || 'ATIVO') as StatusEletricista;

      // Criar todos os eletricistas em uma transação otimizada
      const eletricistasCriados = await prisma.$transaction(
        async tx => {
          const now = new Date();
          const userId = session.user.id;

          // Verificar quais matrículas já existem no banco
          const matriculas = data.eletricistas.map(e => e.matricula);
          const eletricistasExistentes = await tx.eletricista.findMany({
            where: {
              matricula: {
                in: matriculas,
              },
            },
            select: {
              id: true,
              matricula: true,
            },
          });

          // Criar um Set com as matrículas existentes para busca rápida
          const matriculasExistentes = new Set(
            eletricistasExistentes.map(e => e.matricula)
          );

          // Filtrar apenas os eletricistas novos (que não existem)
          const eletricistasNovos = data.eletricistas.filter(
            e => !matriculasExistentes.has(e.matricula)
          );

          // Criar apenas os eletricistas novos
          if (eletricistasNovos.length > 0) {
            const eletricistasData = eletricistasNovos.map(e => ({
              nome: e.nome,
              matricula: e.matricula,
              telefone: e.telefone,
              estado: e.estado,
              admissao: e.admissao,
              cargoId: data.cargoId,
              contratoId: data.contratoId,
              createdAt: now,
              createdBy: userId,
            }));

            await tx.eletricista.createMany({
              data: eletricistasData,
              skipDuplicates: true, // Proteção adicional
            });
          }

          // Buscar os IDs de TODOS os eletricistas (novos e existentes)
          const eletricistasCreated = await tx.eletricista.findMany({
            where: {
              matricula: {
                in: matriculas,
              },
            },
            select: {
              id: true,
              matricula: true,
            },
          });

          // Criar um mapa de matrícula -> id
          const matriculaToId = new Map(
            eletricistasCreated.map(e => [e.matricula, e.id])
          );

          // Verificar quais eletricistas já têm histórico de base ativo
          const eletricistasComBaseAtiva =
            await tx.eletricistaBaseHistorico.findMany({
              where: {
                eletricistaId: {
                  in: eletricistasCreated.map(e => e.id),
                },
                dataFim: null, // Base ativa (sem dataFim)
              },
              select: {
                eletricistaId: true,
              },
            });

          const eletricistasComBaseAtivaSet = new Set(
            eletricistasComBaseAtiva.map(h => h.eletricistaId)
          );

          // Criar históricos de base apenas para eletricistas novos ou sem base ativa
          const historicosBaseData = eletricistasCreated
            .filter(e => !eletricistasComBaseAtivaSet.has(e.id))
            .map(e => {
              const eletricistaData = data.eletricistas.find(
                ed => ed.matricula === e.matricula
              );
              if (!eletricistaData) {
                throw new Error(
                  `Dados do eletricista com matrícula ${e.matricula} não encontrados`
                );
              }
              return {
                eletricistaId: e.id,
                baseId: data.baseId,
                dataInicio: eletricistaData.admissao,
                dataFim: null,
                motivo: 'Lotação inicial',
                createdAt: now,
                createdBy: userId,
              };
            });

          if (historicosBaseData.length > 0) {
            await tx.eletricistaBaseHistorico.createMany({
              data: historicosBaseData,
              skipDuplicates: true,
            });
          }

          // Verificar quais eletricistas já têm status
          const eletricistasComStatus = await tx.eletricistaStatus.findMany({
            where: {
              eletricistaId: {
                in: eletricistasCreated.map(e => e.id),
              },
            },
            select: {
              eletricistaId: true,
            },
          });

          const eletricistasComStatusSet = new Set(
            eletricistasComStatus.map(s => s.eletricistaId)
          );

          // Criar status apenas para eletricistas novos (que não têm status)
          const statusData = eletricistasCreated
            .filter(e => !eletricistasComStatusSet.has(e.id))
            .map(e => ({
              eletricistaId: e.id,
              status: statusInicial,
              dataInicio: now,
              dataFim: null,
              motivo: 'Status inicial após criação em lote',
              createdBy: userId,
              createdAt: now,
            }));

          if (statusData.length > 0) {
            await tx.eletricistaStatus.createMany({
              data: statusData,
              skipDuplicates: true,
            });
          }

          // Criar histórico de status apenas para eletricistas novos
          const historicosStatusData = eletricistasCreated
            .filter(e => !eletricistasComStatusSet.has(e.id))
            .map(e => ({
              eletricistaId: e.id,
              status: statusInicial,
              statusAnterior: undefined, // Primeiro status não tem anterior
              dataInicio: now,
              dataFim: null,
              motivo: 'Status inicial após criação em lote',
              registradoPor: userId,
              createdBy: userId,
              createdAt: now,
            }));

          if (historicosStatusData.length > 0) {
            await tx.eletricistaStatusHistorico.createMany({
              data: historicosStatusData,
              skipDuplicates: true,
            });
          }

          // Identificar quais foram criados agora (novos) vs existentes
          const idsNovos = new Set(
            eletricistasCreated
              .filter(e => !matriculasExistentes.has(e.matricula))
              .map(e => e.id)
          );

          const eletricistasNovosCriados = eletricistasCreated.filter(e =>
            idsNovos.has(e.id)
          );
          const eletricistasExistentesEncontrados = eletricistasCreated.filter(
            e => !idsNovos.has(e.id)
          );

          return {
            todos: eletricistasCreated,
            novos: eletricistasNovosCriados,
            existentes: eletricistasExistentesEncontrados,
            totalNovos: eletricistasNovosCriados.length,
            totalExistentes: eletricistasExistentesEncontrados.length,
          };
        },
        {
          maxWait: 10000, // Tempo máximo de espera: 10 segundos
          timeout: 30000, // Timeout da transação: 30 segundos
        }
      );

      // Calcular estatísticas
      const totalEnviado = data.eletricistas.length;
      const totalNovos = eletricistasCriados.totalNovos;
      const totalExistentes = eletricistasCriados.totalExistentes;

      return {
        eletricistasCriados: totalNovos,
        eletricistasIgnorados: totalExistentes,
        totalEnviado,
        eletricistas: eletricistasCriados.todos,
      };
    },
    rawData,
    { entityName: 'Eletricista', actionType: 'create' }
  );

