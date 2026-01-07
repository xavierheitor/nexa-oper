/**
 * Server Actions para Relatórios de Bases
 *
 * Consolidação de informações por base: veículos, eletricistas, equipes
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '../common/actionHandler';
import { relatorioBaseFiltroSchema } from '@/lib/schemas/relatoriosSchema';

/**
 * Retorna consolidação completa por base
 */
export const getConsolidacaoPorBase = async (rawData?: unknown) =>
  handleServerAction(
    relatorioBaseFiltroSchema,
    async (filtros) => {
      const where: any = {
        deletedAt: null,
      };

      if (filtros.contratoId) {
        where.contratoId = filtros.contratoId;
      }

      if (filtros.baseId) {
        where.id = filtros.baseId;
      }

      const bases = await prisma.base.findMany({
        where,
        include: {
          contrato: true,
        },
      });

      const dataReferencia = filtros.dataReferencia
        ? new Date(filtros.dataReferencia)
        : new Date();

      const resultado = await Promise.all(
        bases.map(async (base) => {
          // Contar veículos lotados na base
          const veiculos = await prisma.veiculoBaseHistorico.count({
            where: {
              baseId: base.id,
              dataFim: null,
              deletedAt: null,
              veiculo: {
                deletedAt: null,
              },
            },
          });

          // Contar eletricistas lotados na base
          const eletricistas = await prisma.eletricistaBaseHistorico.count({
            where: {
              baseId: base.id,
              dataFim: null,
              deletedAt: null,
              eletricista: {
                deletedAt: null,
              },
            },
          });

          // Contar equipes lotadas na base
          const totalEquipes = await prisma.equipeBaseHistorico.count({
            where: {
              baseId: base.id,
              dataFim: null,
              deletedAt: null,
              equipe: {
                deletedAt: null,
              },
            },
          });

          // Contar equipes escaladas (com escala publicada)
          const equipesDaBase = await prisma.equipeBaseHistorico.findMany({
            where: {
              baseId: base.id,
              dataFim: null,
              deletedAt: null,
              equipe: {
                deletedAt: null,
              },
            },
            select: {
              equipeId: true,
            },
          });

          const equipeIds = equipesDaBase.map((e) => e.equipeId);

          // Buscar equipes que têm pelo menos uma escala publicada
          let equipesEscaladas = 0;
          if (equipeIds.length > 0) {
            const escalasPublicadas = await prisma.escalaEquipePeriodo.findMany({
              where: {
                equipeId: { in: equipeIds },
                status: 'PUBLICADA',
                deletedAt: null,
              },
              select: {
                equipeId: true,
              },
              distinct: ['equipeId'],
            });
            equipesEscaladas = escalasPublicadas.length;
          }

          const equipesInativas = totalEquipes - equipesEscaladas;

          // Contar eletricistas escalados (que estão em pelo menos um slot publicado)
          const eletricistasEscalados = await prisma.slotEscala.findMany({
            where: {
              eletricista: {
                deletedAt: null,
                EletricistaBaseHistorico: {
                  some: {
                    baseId: base.id,
                    dataFim: null,
                    deletedAt: null,
                  },
                },
              },
              escalaEquipePeriodo: {
                status: 'PUBLICADA',
                deletedAt: null,
              },
              deletedAt: null,
            },
            select: {
              eletricistaId: true,
            },
            distinct: ['eletricistaId'],
          });

          const eletricistasNaoEscalados = eletricistas - eletricistasEscalados.length;

          return {
            id: base.id,
            nome: base.nome,
            contrato: base.contrato.nome,
            veiculos,
            eletricistas: {
              total: eletricistas,
              escalados: eletricistasEscalados.length,
              naoEscalados: eletricistasNaoEscalados,
            },
            equipes: {
              total: totalEquipes,
              escaladas: equipesEscaladas,
              inativas: equipesInativas,
            },
          };
        })
      );

      return resultado.sort((a, b) => b.eletricistas.total - a.eletricistas.total);
    },
    rawData,
    { entityName: 'Relatorio', actionType: 'read' }
  );

/**
 * Retorna comparação de recursos entre bases
 */
export const getComparacaoEntreBases = async (rawData?: unknown) =>
  handleServerAction(
    relatorioBaseFiltroSchema,
    async (filtros) => {
      const where: any = {
        deletedAt: null,
      };

      if (filtros.contratoId) {
        where.contratoId = filtros.contratoId;
      }

      if (filtros.baseId) {
        where.id = filtros.baseId;
      }

      const bases = await prisma.base.findMany({
        where,
        include: {
          contrato: true,
        },
      });

      const resultado = await Promise.all(
        bases.map(async (base) => {
          // Contar veículos
          const veiculos = await prisma.veiculoBaseHistorico.count({
            where: {
              baseId: base.id,
              dataFim: null,
              deletedAt: null,
              veiculo: { deletedAt: null },
            },
          });

          // Contar eletricistas
          const eletricistas = await prisma.eletricistaBaseHistorico.count({
            where: {
              baseId: base.id,
              dataFim: null,
              deletedAt: null,
              eletricista: { deletedAt: null },
            },
          });

          // Contar equipes
          const equipes = await prisma.equipeBaseHistorico.count({
            where: {
              baseId: base.id,
              dataFim: null,
              deletedAt: null,
              equipe: { deletedAt: null },
            },
          });

          return {
            base: base.nome,
            veiculos,
            eletricistas,
            equipes,
          };
        })
      );

      return resultado;
    },
    rawData,
    { entityName: 'Relatorio', actionType: 'read' }
  );

/**
 * Retorna eletricistas não escalados (sem slots em escalas publicadas)
 */
export const getEletricistasNaoEscalados = async (rawData?: unknown) =>
  handleServerAction(
    relatorioBaseFiltroSchema,
    async (filtros) => {
      const whereBases: any = {
        deletedAt: null,
      };

      if (filtros.contratoId) {
        whereBases.contratoId = filtros.contratoId;
      }

      if (filtros.baseId) {
        whereBases.id = filtros.baseId;
      }

      const bases = await prisma.base.findMany({
        where: whereBases,
        select: {
          id: true,
          nome: true,
          contrato: {
            select: {
              nome: true,
            },
          },
        },
      });

      if (bases.length === 0) {
        return [];
      }

      const baseIds = bases.map((base) => base.id);

      const eletricistasNaBase = await prisma.eletricistaBaseHistorico.findMany({
        where: {
          baseId: { in: baseIds },
          dataFim: null,
          deletedAt: null,
          eletricista: {
            deletedAt: null,
          },
        },
        include: {
          base: {
            select: {
              id: true,
              nome: true,
              contrato: {
                select: {
                  nome: true,
                },
              },
            },
          },
          eletricista: {
            select: {
              id: true,
              nome: true,
              matricula: true,
              Status: {
                select: {
                  status: true,
                  dataInicio: true,
                  dataFim: true,
                  motivo: true,
                  observacoes: true,
                },
              },
            },
          },
        },
      });

      const eletricistaIds = [
        ...new Set(eletricistasNaBase.map((item) => item.eletricistaId)),
      ];

      if (eletricistaIds.length === 0) {
        return [];
      }

      const eletricistasEscalados = await prisma.slotEscala.findMany({
        where: {
          eletricistaId: { in: eletricistaIds },
          escalaEquipePeriodo: {
            status: 'PUBLICADA',
            deletedAt: null,
          },
          deletedAt: null,
        },
        select: {
          eletricistaId: true,
        },
        distinct: ['eletricistaId'],
      });

      const escaladosSet = new Set(
        eletricistasEscalados.map((item) => item.eletricistaId)
      );

      return eletricistasNaBase
        .filter((item) => !escaladosSet.has(item.eletricistaId))
        .map((item) => ({
          eletricistaId: item.eletricistaId,
          nome: item.eletricista.nome,
          matricula: item.eletricista.matricula,
          baseId: item.baseId,
          baseNome: item.base.nome,
          contratoNome: item.base.contrato?.nome ?? '-',
          status: item.eletricista.Status?.status ?? 'ATIVO',
          statusMotivo: item.eletricista.Status?.motivo ?? null,
        }))
        .sort((a, b) => a.nome.localeCompare(b.nome));
    },
    rawData,
    { entityName: 'Relatorio', actionType: 'read' }
  );

/**
 * Retorna distribuição de equipes por base
 */
export const getEquipesPorBase = async (rawData?: unknown) =>
  handleServerAction(
    relatorioBaseFiltroSchema,
    async (filtros) => {
      const where: any = {
        deletedAt: null,
      };

      if (filtros.contratoId) {
        where.contratoId = filtros.contratoId;
      }

      const bases = await prisma.base.findMany({
        where,
        include: {
          EquipeBaseHistorico: {
            where: {
              dataFim: null,
              deletedAt: null,
            },
            include: {
              equipe: {
                // Note: where não é permitido dentro de include, mas podemos filtrar depois
              },
            },
          },
        },
      });

      const resultado = bases.map((base) => ({
        base: base.nome,
        quantidade: base.EquipeBaseHistorico.length,
      }));

      // Adicionar equipes sem base
      const equipeSemBase = await prisma.equipe.count({
        where: {
          deletedAt: null,
          EquipeBaseHistorico: {
            none: {
              dataFim: null,
              deletedAt: null,
            },
          },
        },
      });

      if (equipeSemBase > 0) {
        resultado.push({
          base: 'Sem Lotação',
          quantidade: equipeSemBase,
        });
      }

      return resultado.filter((r) => r.quantidade > 0);
    },
    rawData,
    { entityName: 'Relatorio', actionType: 'read' }
  );

/**
 * Retorna estatísticas detalhadas de uma base específica
 */
export const getDetalhesBase = async (baseId: number, rawData?: unknown) => {
  const schema = relatorioBaseFiltroSchema.extend({
    baseId: relatorioBaseFiltroSchema.shape.contratoId,
  });

  return handleServerAction(
    schema,
    async (filtros) => {
      const base = await prisma.base.findUnique({
        where: { id: baseId },
        include: {
          contrato: true,
        },
      });

      if (!base) {
        throw new Error('Base não encontrada');
      }

      // Veículos por tipo
      const veiculosPorTipo = await prisma.veiculoBaseHistorico.findMany({
        where: {
          baseId,
          dataFim: null,
          deletedAt: null,
          veiculo: {
            deletedAt: null,
          },
        },
        include: {
          veiculo: {
            include: {
              tipoVeiculo: true,
            },
          },
        },
      });

      const veiculosAgrupados = veiculosPorTipo.reduce((acc, v) => {
        const tipo = v.veiculo.tipoVeiculo.nome;
        if (!acc[tipo]) {
          acc[tipo] = 0;
        }
        acc[tipo]++;
        return acc;
      }, {} as Record<string, number>);

      // Eletricistas por cargo
      const eletricistasPorCargo = await prisma.eletricistaBaseHistorico.findMany({
        where: {
          baseId,
          dataFim: null,
          deletedAt: null,
          eletricista: {
            deletedAt: null,
          },
        },
        include: {
          eletricista: {
            include: {
              cargo: true,
            },
          },
        },
      });

      const eletricistasAgrupados = eletricistasPorCargo.reduce((acc, e) => {
        const cargo = e.eletricista.cargo.nome;
        if (!acc[cargo]) {
          acc[cargo] = 0;
        }
        acc[cargo]++;
        return acc;
      }, {} as Record<string, number>);

      // Equipes por tipo
      const equipesPorTipo = await prisma.equipeBaseHistorico.findMany({
        where: {
          baseId,
          dataFim: null,
          deletedAt: null,
          equipe: {
            deletedAt: null,
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

      const equipesAgrupadas = equipesPorTipo.reduce((acc, e) => {
        const tipo = e.equipe.tipoEquipe.nome;
        if (!acc[tipo]) {
          acc[tipo] = 0;
        }
        acc[tipo]++;
        return acc;
      }, {} as Record<string, number>);

      return {
        base: {
          id: base.id,
          nome: base.nome,
          contrato: base.contrato.nome,
        },
        veiculos: {
          total: veiculosPorTipo.length,
          porTipo: Object.entries(veiculosAgrupados).map(([tipo, qtd]) => ({
            tipo,
            quantidade: qtd,
          })),
        },
        eletricistas: {
          total: eletricistasPorCargo.length,
          porCargo: Object.entries(eletricistasAgrupados).map(([cargo, qtd]) => ({
            cargo,
            quantidade: qtd,
          })),
        },
        equipes: {
          total: equipesPorTipo.length,
          porTipo: Object.entries(equipesAgrupadas).map(([tipo, qtd]) => ({
            tipo,
            quantidade: qtd,
          })),
        },
      };
    },
    { ...(typeof rawData === 'object' && rawData !== null ? rawData : {}), baseId },
    { entityName: 'Relatorio', actionType: 'read' }
  );
};
