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

import { Eletricista } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../abstracts/AbstractCrudRepository';
import { prisma } from '../db/db.service';
import { EletricistaCreate, EletricistaUpdate } from '../schemas/eletricistaSchema';
import { PaginationParams } from '../types/common';

interface EletricistaFilter extends PaginationParams {
  contratoId?: number;
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
    const { baseId: dataBaseId, ...eletricistaData } = data as EletricistaCreate & {
      baseId?: number;
    };

    const rawBaseId = baseIdInput ?? dataBaseId;
    const normalizedBaseId =
      rawBaseId === undefined || rawBaseId === null
        ? undefined
        : Number(rawBaseId);

    if (normalizedBaseId !== undefined && Number.isNaN(normalizedBaseId)) {
      throw new Error('Base inválida para eletricista.');
    }
    const createdBy = (eletricistaData as any).createdBy || userId || '';
    const createdAt = (eletricistaData as any).createdAt || new Date();

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
    const { baseId: dataBaseId, id: _ignoredId, ...eletricistaData } = data as EletricistaUpdate & {
      baseId?: number;
    } & { id: number };

    const rawBaseId = baseIdInput ?? dataBaseId;
    const normalizedBaseId =
      rawBaseId === undefined || rawBaseId === null
        ? undefined
        : Number(rawBaseId);

    if (normalizedBaseId !== undefined && Number.isNaN(normalizedBaseId)) {
      throw new Error('Base inválida para eletricista.');
    }
    const updatedBy = (eletricistaData as any).updatedBy || userId || '';
    const updatedAt = (eletricistaData as any).updatedAt || new Date();

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
    where: any,
    orderBy: any,
    skip: number,
    take: number,
    include?: any
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
  protected count(where: any): Promise<number> {
    return prisma.eletricista.count({ where });
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
