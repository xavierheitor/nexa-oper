/**
 * Repository para MobileUser
 *
 * Este repository implementa todas as operações de acesso a dados
 * para usuários móveis, estendendo o AbstractCrudRepository para
 * funcionalidades CRUD básicas e adicionando métodos específicos.
 *
 * FUNCIONALIDADES:
 * - CRUD completo (Create, Read, Update, Delete)
 * - Soft delete com auditoria automática
 * - Busca por username com validação de unicidade
 * - Exclusão automática de senha em consultas de segurança
 * - Métodos específicos para autenticação
 * - Suporte a includes dinâmicos para relacionamentos
 * - Paginação, filtros e ordenação
 *
 * SEGURANÇA:
 * - Senhas são automaticamente excluídas em consultas padrão
 * - Métodos específicos para busca com senha (autenticação)
 * - Validação de unicidade de username
 * - Auditoria completa de todas as operações
 *
 * PADRÕES:
 * - Extends AbstractCrudRepository para consistência
 * - Implementa ICrudRepository interface
 * - Usa Prisma para acesso ao banco de dados
 * - Segue padrões de nomenclatura do projeto
 * - Documentação JSDoc completa
 *
 * RELACIONAMENTOS:
 * - MobileSession (sessões ativas do usuário)
 * - MobileToken (tokens de autenticação)
 * - Suporte a includes dinâmicos via parâmetro
 */

import { AbstractCrudRepository } from '@/lib/abstracts/AbstractCrudRepository';
import { PaginationParams } from '@/lib/types/common';
import { MobileUser, Prisma } from '@nexa-oper/db';
import { prisma } from '../../db/db.service';
import {
  MobileUserCreateData,
  MobileUserUpdateData,
} from '../../schemas/mobileUserSchema';

// Interface para filtros de usuário móvel (igual ao UserRepository)
interface MobileUserFilter extends PaginationParams {
  search?: string;
  include?: any;
}

/**
 * Repository para operações de MobileUser
 *
 * Implementa padrão Repository para isolamento da camada de dados,
 * fornecendo interface limpa para operações de usuários móveis.
 */
export class MobileUserRepository extends AbstractCrudRepository<
  MobileUser,
  MobileUserFilter
> {
  /**
   * Cria um novo usuário móvel
   *
   * @param data - Dados do usuário móvel a ser criado
   * @param userId - ID do usuário que está criando (para auditoria)
   * @returns Promise com o usuário móvel criado (sem senha)
   */
  async create(
    data: MobileUserCreateData,
    userId?: string
  ): Promise<MobileUser> {
    const newMobileUser = await prisma.mobileUser.create({
      data: {
        ...data,
        createdBy: userId || 'system',
        createdAt: new Date(),
      },
    });

    // Remove a senha antes de retornar (igual ao UserRepository)
    const { password: _password, ...mobileUserSafe } = newMobileUser;
    return mobileUserSafe as MobileUser;
  }

  /**
   * Atualiza um usuário móvel existente
   *
   * @param id - ID do usuário móvel a ser atualizado
   * @param data - Dados a serem atualizados
   * @param userId - ID do usuário que está atualizando (para auditoria)
   * @returns Promise com o usuário móvel atualizado (sem senha)
   */
  async update(
    id: number,
    data: Partial<MobileUserUpdateData>,
    userId?: string
  ): Promise<MobileUser> {
    const updatedMobileUser = await prisma.mobileUser.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId || 'system',
        updatedAt: new Date(),
      },
    });

    // Remove a senha antes de retornar (igual ao UserRepository)
    const { password: _password, ...mobileUserSafe } = updatedMobileUser;
    return mobileUserSafe as MobileUser;
  }

  /**
   * Exclui um usuário móvel (soft delete)
   *
   * @param id - ID do usuário móvel a ser excluído
   * @param userId - ID do usuário que está excluindo (para auditoria)
   * @returns Promise<void>
   */
  async delete(id: number, userId: string): Promise<MobileUser> {
    const mobileUser = await prisma.mobileUser.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    // Remove a senha antes de retornar (igual ao UserRepository)
    const { password: _password, ...mobileUserSafe } = mobileUser;
    return mobileUserSafe as MobileUser;
  }

  /**
   * Busca um usuário móvel por ID (sem senha)
   *
   * @param id - ID do usuário móvel
   * @returns Promise com o usuário móvel encontrado ou null
   */
  async findById(id: number): Promise<MobileUser | null> {
    const mobileUser = await prisma.mobileUser.findFirst({
      where: {
        id,
        deletedAt: null, // Apenas usuários não excluídos
      },
      select: {
        id: true,
        username: true,
        createdAt: true,
        createdBy: true,
        updatedAt: true,
        updatedBy: true,
        deletedAt: true,
        deletedBy: true,
      },
    });

    return mobileUser as MobileUser | null;
  }

  /**
   * Busca usuário móvel por username (sem senha)
   *
   * @param username - Username do usuário móvel
   * @returns Promise com o usuário móvel encontrado ou null
   */
  async findByUsername(username: string): Promise<MobileUser | null> {
    const mobileUser = await prisma.mobileUser.findFirst({
      where: {
        username,
        deletedAt: null, // Apenas usuários não excluídos
      },
      select: {
        id: true,
        username: true,
        createdAt: true,
        createdBy: true,
        updatedAt: true,
        updatedBy: true,
        deletedAt: true,
        deletedBy: true,
      },
    });

    return mobileUser as MobileUser | null;
  }

  /**
   * Busca usuário móvel por username incluindo senha (para autenticação)
   *
   * @param username - Username do usuário móvel
   * @returns Promise com o usuário móvel completo ou null
   */
  async findByUsernameWithPassword(
    username: string
  ): Promise<MobileUser | null> {
    return await prisma.mobileUser.findFirst({
      where: {
        username,
        deletedAt: null, // Apenas usuários não excluídos
      },
    });
  }

  /**
   * Verifica se um username já existe
   *
   * @param username - Username a ser verificado
   * @param excludeId - ID a ser excluído da verificação (para updates)
   * @returns Promise<boolean> indicando se o username existe
   */
  async usernameExists(username: string, excludeId?: number): Promise<boolean> {
    const where: Prisma.MobileUserWhereInput = {
      username,
      deletedAt: null,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await prisma.mobileUser.count({ where });
    return count > 0;
  }

  /**
   * Define os campos que podem ser utilizados para busca
   *
   * @returns Array com os nomes dos campos de busca
   */
  protected getSearchFields(): string[] {
    return ['username'];
  }

  /**
   * Implementa busca paginada com filtros (protegida, exclui senhas)
   *
   * @param where - Condições de filtro
   * @param orderBy - Ordenação
   * @param skip - Registros a pular (paginação)
   * @param take - Registros a retornar (limite)
   * @param include - Relacionamentos a incluir
   * @returns Promise com array de usuários móveis (sem senhas)
   */
  protected async findMany(
    where: Prisma.MobileUserWhereInput,
    orderBy: Prisma.MobileUserOrderByWithRelationInput,
    skip: number,
    take: number,
    include?: any
  ): Promise<MobileUser[]> {
    if (include) {
      // Se há includes, busca com include e remove senha manualmente
      const mobileUsers = await prisma.mobileUser.findMany({
        where,
        orderBy,
        skip,
        take,
        include,
      });

      return mobileUsers.map((mobileUser: any) => {
        const { password: _password, ...mobileUserSafe } = mobileUser;
        return mobileUserSafe as MobileUser;
      });
    }

    // Sem includes, usa select para excluir senha automaticamente
    const mobileUsers = await prisma.mobileUser.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        id: true,
        username: true,
        createdAt: true,
        createdBy: true,
        updatedAt: true,
        updatedBy: true,
        deletedAt: true,
        deletedBy: true,
      },
    });

    return mobileUsers as MobileUser[];
  }

  /**
   * Conta registros que atendem aos critérios de filtro
   *
   * @param where - Condições de filtro
   * @returns Promise com número total de registros
   */
  protected async count(where: Prisma.MobileUserWhereInput): Promise<number> {
    return await prisma.mobileUser.count({ where });
  }
}
