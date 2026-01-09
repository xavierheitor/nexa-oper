/**
 * Repositório para Eletricistas
 *
 * Este repositório implementa operações de acesso a dados
 * para a entidade Eletricista, utilizando o padrão Repository
 * e estendendo a classe abstrata AbstractCrudRepository.
 *
 * FUNCIONALIDADES:
 * - Operações CRUD completas
 * - Paginação automática
 * - Busca por nome, matrícula e telefone
 * - Soft delete com auditoria
 * - Integração com Prisma ORM
 *
 * COMO USAR:
 * ```typescript
 * const repository = new EletricistaRepository();
 * const eletricistas = await repository.list({ page: 1, pageSize: 10 });
 * const eletricista = await repository.findById(1);
 */

import { Eletricista, StatusEletricista, Prisma } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import {
  EletricistaCreate,
  EletricistaUpdate,
} from '../../schemas/eletricistaSchema';
import { PaginationParams } from '../../types/common';
import type {
  GenericPrismaWhereInput,
  GenericPrismaOrderByInput,
  GenericPrismaIncludeInput,
} from '../../types/prisma';

/**
 * Tipo auxiliar para dados com campos de auditoria
 */
interface WithAuditFields {
  createdBy?: string;
  createdAt?: Date;
  updatedBy?: string;
  updatedAt?: Date;
}

interface EletricistaFilter extends PaginationParams {
  contratoId?: number;
  cargoId?: number;
  baseId?: number;
  estado?: string;
  status?: string; // Status do eletricista (StatusEletricista enum)
}

export class EletricistaRepository extends AbstractCrudRepository<
  Eletricista,
  EletricistaFilter
> {
  /**
   * Cria um novo eletricista
   *
   * @param data - Dados do eletricista
   * @param userId - ID do usuário que está criando (opcional)
   * @returns Eletricista criado
   */
  async create(
    data: EletricistaCreate,
    userId?: string,
    baseIdInput?: number
  ): Promise<Eletricista> {
    const {
      baseId: dataBaseId,
      status,
      ...eletricistaData
    } = data as EletricistaCreate & {
      baseId?: number;
      status?: string;
    };

    const rawBaseId = baseIdInput ?? dataBaseId;
    const normalizedBaseId =
      rawBaseId === undefined || rawBaseId === null
        ? undefined
        : Number(rawBaseId);

    const createdBy =
      (eletricistaData as WithAuditFields).createdBy || userId || '';
    const createdAt =
      (eletricistaData as WithAuditFields).createdAt || new Date();
    const statusInicial = status || 'ATIVO';

    return prisma.$transaction(async tx => {
      const eletricista = await tx.eletricista.create({
        data: {
          ...eletricistaData,
          admissao: data.admissao || new Date(),
          cargoId: data.cargoId,
          createdBy,
          createdAt,
        },
      });

      // Cria o status inicial do eletricista
      const statusCriado = await tx.eletricistaStatus.create({
        data: {
          eletricistaId: eletricista.id,
          status: statusInicial as StatusEletricista,
          dataInicio: new Date(),
          motivo: 'Status inicial após criação',
          createdBy,
          createdAt: new Date(),
        },
      });

      // Cria o registro histórico separadamente
      await tx.eletricistaStatusHistorico.create({
        data: {
          eletricistaId: eletricista.id,
          status: statusInicial as StatusEletricista,
          statusAnterior: undefined,
          dataInicio: new Date(),
          motivo: 'Status inicial após criação',
          registradoPor: createdBy,
          createdBy,
          createdAt: new Date(),
        },
      });

      if (typeof normalizedBaseId === 'number') {
        await tx.eletricistaBaseHistorico.create({
          data: {
            eletricistaId: eletricista.id,
            baseId: normalizedBaseId,
            dataInicio: new Date(),
            motivo: 'Lotação inicial',
            createdBy,
            createdAt: new Date(),
          },
        });
      }

      return eletricista;
    });
  }

  /**
   * Atualiza um eletricista existente
   *
   * @param id - ID do eletricista
   * @param data - Dados para atualização
   * @param userId - ID do usuário que está atualizando (opcional)
   * @returns Eletricista atualizado
   */
  async update(
    id: number,
    data: EletricistaUpdate,
    userId?: string,
    baseIdInput?: number
  ): Promise<Eletricista> {
    const {
      baseId: dataBaseId,
      id: _ignoredId,
      ...eletricistaData
    } = data as EletricistaUpdate & {
      baseId?: number;
    } & { id: number };

    const rawBaseId = baseIdInput ?? dataBaseId;
    const normalizedBaseId =
      rawBaseId === undefined || rawBaseId === null
        ? undefined
        : Number(rawBaseId);

    const updatedBy =
      (eletricistaData as WithAuditFields).updatedBy || userId || '';
    const updatedAt =
      (eletricistaData as WithAuditFields).updatedAt || new Date();

    return prisma.$transaction(async tx => {
      const eletricista = await tx.eletricista.update({
        where: { id },
        data: {
          ...eletricistaData,
          ...(data.admissao && { admissao: data.admissao }),
          ...(data.cargoId && { cargoId: data.cargoId }),
          updatedBy,
          updatedAt,
        },
      });

      if (typeof normalizedBaseId === 'number') {
        const currentBase = await tx.eletricistaBaseHistorico.findFirst({
          where: {
            eletricistaId: id,
            dataFim: null,
          },
          orderBy: {
            dataInicio: 'desc',
          },
        });

        if (!currentBase || currentBase.baseId !== normalizedBaseId) {
          if (currentBase) {
            await tx.eletricistaBaseHistorico.update({
              where: { id: currentBase.id },
              data: {
                dataFim: new Date(),
                updatedBy,
                updatedAt: new Date(),
              },
            });
          }

          await tx.eletricistaBaseHistorico.create({
            data: {
              eletricistaId: id,
              baseId: normalizedBaseId,
              dataInicio: new Date(),
              motivo: 'Alteração de lotação via edição',
              createdBy: updatedBy,
              createdAt: new Date(),
            },
          });
        }
      }

      return eletricista;
    });
  }

  /**
   * Exclui um eletricista existente
   *
   * @param id - ID do eletricista
   * @param userId - ID do usuário que está excluindo
   * @returns Eletricista excluído
   */
  delete(id: number, userId: string): Promise<Eletricista> {
    return prisma.eletricista.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }

  /**
   * Busca um eletricista por ID
   *
   * @param id - ID do eletricista
   * @returns Eletricista encontrado ou null
   */
  findById(id: number): Promise<Eletricista | null> {
    return prisma.eletricista.findUnique({
      where: { id, deletedAt: null },
    });
  }

  /**
   * Define os campos que podem ser utilizados para busca
   *
   * @returns Array com os nomes dos campos de busca
   */
  protected getSearchFields(): string[] {
    return ['nome', 'matricula', 'telefone'];
  }

  /**
   * Busca múltiplos eletricistas
   *
   * @param where - Condições de filtro
   * @param orderBy - Ordenação
   * @param skip - Registros a pular
   * @param take - Registros a retornar
   * @param include - Relacionamentos a incluir (opcional)
   * @returns Array de eletricistas
   */
  protected async findMany(
    where: GenericPrismaWhereInput,
    orderBy: GenericPrismaOrderByInput,
    skip: number,
    take: number,
    include?: GenericPrismaIncludeInput
  ): Promise<Eletricista[]> {
    const eletricistas = await prisma.eletricista.findMany({
      where,
      orderBy,
      skip,
      take,
      ...(include && { include }),
    });

    // Para cada eletricista, buscar sua base atual
    const eletricistasWithBase = await Promise.all(
      eletricistas.map(async eletricista => {
        try {
          const currentBase = await prisma.eletricistaBaseHistorico.findFirst({
            where: {
              eletricistaId: eletricista.id,
              dataFim: null, // Base ativa
            },
            include: {
              base: true,
            },
          });

          return {
            ...eletricista,
            baseAtual: currentBase?.base || null,
          };
        } catch (error) {
          console.error(
            `Erro ao buscar base para eletricista ${eletricista.id}:`,
            error
          );
          return {
            ...eletricista,
            baseAtual: null,
          };
        }
      })
    );

    return eletricistasWithBase;
  }

  /**
   * Conta o número de eletricistas
   *
   * @param where - Condições de filtro
   * @returns Número total de eletricistas
   */
  protected count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.eletricista.count({ where });
  }

  /**
   * Lista eletricistas com filtros server-side
   *
   * Sobrescreve o método base para adicionar suporte a filtros
   * de relacionamentos (cargo, base, estado)
   */
  /**
   * Lista eletricistas com filtros server-side
   *
   * Sobrescreve o método base para adicionar suporte a filtros
   * de relacionamentos (cargo, base, estado) de forma otimizada
   */
  async list(
    params: EletricistaFilter
  ): Promise<{ items: Eletricista[]; total: number }> {
    const {
      page = 1,
      pageSize = 10,
      orderBy = 'id',
      orderDir = 'asc',
      search,
      cargoId,
      baseId,
      estado,
      contratoId,
      status,
      include,
    } = params;

    const skip = (page - 1) * pageSize;

    // Construção do where usando array de condições para evitar conflitos de chaves
    const conditions: Prisma.EletricistaWhereInput[] = [];

    // 1. Soft delete
    conditions.push({ deletedAt: null });

    // 2. Filtros diretos
    if (contratoId) conditions.push({ contratoId });
    if (cargoId) conditions.push({ cargoId });
    if (estado) conditions.push({ estado: { contains: estado } });

    // 3. Busca por texto (OR)
    if (search) {
      const searchFields = this.getSearchFields();
      if (searchFields.length > 0) {
        conditions.push({
          OR: searchFields.map(field => ({
            [field]: { contains: search },
          })),
        });
      }
    }

    // 4. Filtro de Base (Relacionamento)
    // Substitui a filtragem em memória por queries otimizadas no banco
    if (baseId !== undefined) {
      if (baseId === -1) {
        // Sem lotação: Não tem histórico de base ativo
        conditions.push({
          EletricistaBaseHistorico: {
            none: {
              dataFim: null,
              deletedAt: null,
            },
          },
        });
      } else {
        // Com lotação específica ativa
        conditions.push({
          EletricistaBaseHistorico: {
            some: {
              baseId,
              dataFim: null,
              deletedAt: null,
            },
          },
        });
      }
    }

    // 5. Filtro de Status (Relacionamento)
    // Substitui a filtragem em memória por queries otimizadas no banco
    if (status) {
      if (status === 'ATIVO') {
        // ATIVO: Tem status ATIVO ou não tem nenhum registro de status
        conditions.push({
          OR: [
            {
              Status: {
                status: 'ATIVO',
              },
            },
            {
              Status: null,
            },
          ],
        });
      } else {
        // Outros status
        conditions.push({
          Status: {
            status: status as StatusEletricista,
          },
        });
      }
    }

    // Combina todas as condições em um AND
    const where: Prisma.EletricistaWhereInput = {
      AND: conditions,
    };

    const [total, items] = await Promise.all([
      prisma.eletricista.count({ where }),
      this.findMany(where, { [orderBy]: orderDir }, skip, pageSize, include),
    ]);

    return { items, total };
  }

  /**
   * Busca eletricistas por contrato
   *
   * @param contratoId - ID do contrato
   * @returns Array de eletricistas
   */
  findByContratoId(contratoId: number): Promise<Eletricista[]> {
    return prisma.eletricista.findMany({
      where: { contratoId, deletedAt: null },
    });
  }

  /**
   * Busca eletricistas por nome
   *
   * @param nome - Nome do eletricista
   * @returns Array de eletricistas
   */
  findByNome(nome: string): Promise<Eletricista[]> {
    return prisma.eletricista.findMany({ where: { nome, deletedAt: null } });
  }

  /**
   * Busca eletricistas por matrícula
   *
   * @param matricula - Matrícula do eletricista
   * @returns Array de eletricistas
   */
  findByMatricula(matricula: string): Promise<Eletricista[]> {
    return prisma.eletricista.findMany({
      where: { matricula, deletedAt: null },
    });
  }
}
