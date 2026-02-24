/**
 * Repositório para Usuários Web
 *
 * Este repositório implementa operações de acesso a dados
 * para a entidade User, utilizando o padrão Repository
 * e estendendo a classe abstrata AbstractCrudRepository.
 *
 * FUNCIONALIDADES:
 * - Operações CRUD completas
 * - Paginação automática
 * - Busca por nome, email e username
 * - Soft delete com auditoria
 * - Validação de unicidade (email/username)
 * - Exclusão de senha em consultas de listagem
 * - Integração com Prisma ORM
 *
 * SEGURANÇA:
 * - Senhas nunca são retornadas em listagens
 * - Soft delete para auditoria
 * - Validação de unicidade antes de criar/atualizar
 *
 * COMO USAR:
 * ```typescript
 * const repository = new UserRepository();
 * const users = await repository.list({ page: 1, pageSize: 10 });
 * const user = await repository.findById(1);
 * const exists = await repository.emailExists('test@example.com');
 * ```
 */

import { User } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import {
  UserCreateData,
  UserSafe,
  UserUpdateData,
} from '../../schemas/userSchema';
import { PaginationParams } from '../../types/common';
import type { GenericPrismaWhereInput, GenericPrismaOrderByInput, GenericPrismaIncludeInput } from '../../types/prisma';

// Interface para filtros de usuário
interface UserFilter extends PaginationParams {
  ativo?: boolean; // Para filtrar usuários não deletados
}

export class UserRepository extends AbstractCrudRepository<User, UserFilter> {
  /**
   * Cria um novo usuário
   *
   * @param data - Dados do usuário (com senha já hasheada)
   * @param userId - ID do usuário que está criando (opcional)
   * @returns Usuário criado (sem senha)
   */
  async create(data: UserCreateData, userId?: string): Promise<User> {
    const user = await prisma.user.create({
      data: {
        ...data,
        createdBy: userId || 'system',
        createdAt: new Date(),
      },
    });

    // Remove a senha do retorno
    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  /**
   * Atualiza um usuário existente
   *
   * @param id - ID do usuário
   * @param data - Dados para atualização
   * @param userId - ID do usuário que está atualizando (opcional)
   * @returns Usuário atualizado (sem senha)
   */
  async update(
    id: number,
    data: UserUpdateData,
    userId?: string
  ): Promise<User> {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId || 'system',
        updatedAt: new Date(),
      },
    });

    // Remove a senha do retorno
    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  /**
   * Exclui um usuário (soft delete)
   *
   * @param id - ID do usuário
   * @param userId - ID do usuário que está excluindo
   * @returns Usuário excluído (sem senha)
   */
  async delete(id: number, userId: string): Promise<User> {
    const user = await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    // Remove a senha do retorno
    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  /**
   * Busca um usuário por ID
   *
   * @param id - ID do usuário
   * @returns Usuário encontrado ou null (sem senha)
   */
  async findById(id: number): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        nome: true,
        email: true,
        username: true,
        createdAt: true,
        createdBy: true,
        updatedAt: true,
        updatedBy: true,
        deletedAt: true,
        deletedBy: true,
        // password: false - Não inclui senha
      },
    });

    return user as User | null;
  }

  /**
   * Busca um usuário por ID incluindo a senha (para autenticação)
   *
   * @param id - ID do usuário
   * @returns Usuário encontrado ou null (com senha)
   */
  async findByIdWithPassword(id: number): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id, deletedAt: null },
    });
  }

  /**
   * Busca um usuário por email incluindo senha (para login)
   *
   * @param email - Email do usuário
   * @returns Usuário encontrado ou null (com senha)
   */
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email, deletedAt: null },
    });
  }

  /**
   * Busca um usuário por username incluindo senha (para login)
   *
   * @param username - Username do usuário
   * @returns Usuário encontrado ou null (com senha)
   */
  async findByUsernameWithPassword(username: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { username, deletedAt: null },
    });
  }

  /**
   * Verifica se um email já existe
   *
   * @param email - Email para verificar
   * @param excludeId - ID para excluir da verificação (opcional, para updates)
   * @returns true se email existe, false caso contrário
   */
  async emailExists(email: string, excludeId?: number): Promise<boolean> {
    const user = await prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    return !!user;
  }

  /**
   * Verifica se um username já existe
   *
   * @param username - Username para verificar
   * @param excludeId - ID para excluir da verificação (opcional, para updates)
   * @returns true se username existe, false caso contrário
   */
  async usernameExists(username: string, excludeId?: number): Promise<boolean> {
    const user = await prisma.user.findFirst({
      where: {
        username,
        deletedAt: null,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    return !!user;
  }

  /**
   * Define os campos que podem ser utilizados para busca
   *
   * @returns Array com os nomes dos campos de busca
   */
  protected getSearchFields(): string[] {
    return ['nome', 'email', 'username'];
  }

  /**
   * Executa a consulta findMany no Prisma (sem senhas)
   *
   * @param where - Condições de filtro
   * @param orderBy - Ordenação
   * @param skip - Registros a pular
   * @param take - Registros a retornar
   * @param include - Relacionamentos a incluir (opcional)
   * @returns Array de usuários (sem senhas)
   */
  protected async findMany(
    where: GenericPrismaWhereInput,
    orderBy: GenericPrismaOrderByInput,
    skip: number,
    take: number,
    include?: GenericPrismaIncludeInput
  ): Promise<User[]> {
    if (include) {
      // Se include for fornecido, usar findMany com include
      const users = await prisma.user.findMany({
        where,
        orderBy,
        skip,
        take,
        include,
      });

      // Remove senhas dos resultados
      return users.map(user => {
        const userRecord = user as Record<string, unknown>;
        const { password: _password, ...userWithoutPassword } = userRecord;
        return userWithoutPassword as User;
      });
    }

    // Se não há include, usar select para excluir senha
    const users = await prisma.user.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        id: true,
        nome: true,
        email: true,
        username: true,
        createdAt: true,
        createdBy: true,
        updatedAt: true,
        updatedBy: true,
        deletedAt: true,
        deletedBy: true,
        // password: false - Não inclui senha
      },
    });

    return users as User[];
  }

  /**
   * Executa a consulta count no Prisma
   *
   * @param where - Condições de filtro
   * @returns Número total de usuários
   */
  protected async count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.user.count({ where });
  }

  /**
   * Lista usuários ativos (não deletados)
   *
   * @returns Array de usuários ativos
   */
  async findActive(): Promise<UserSafe[]> {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        nome: true,
        email: true,
        username: true,
        createdAt: true,
        createdBy: true,
        updatedAt: true,
        updatedBy: true,
        deletedAt: true,
        deletedBy: true,
      },
      orderBy: { nome: 'asc' },
    });

    return users as UserSafe[];
  }

  /**
   * Busca usuários por nome (busca parcial)
   *
   * @param nome - Nome para buscar
   * @returns Array de usuários encontrados
   */
  async findByNome(nome: string): Promise<UserSafe[]> {
    const users = await prisma.user.findMany({
      where: {
        nome: { contains: nome },
        deletedAt: null,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        username: true,
        createdAt: true,
        createdBy: true,
        updatedAt: true,
        updatedBy: true,
        deletedAt: true,
        deletedBy: true,
      },
      orderBy: { nome: 'asc' },
    });

    return users as UserSafe[];
  }
}
