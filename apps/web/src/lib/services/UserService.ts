/**
 * Serviço para Usuários Web
 *
 * Este serviço implementa a lógica de negócio para operações
 * relacionadas a usuários web, incluindo validação, transformação
 * de dados, hash de senhas e integração com o repositório.
 *
 * FUNCIONALIDADES:
 * - Validação de dados com Zod
 * - Hash seguro de senhas com bcrypt
 * - Validação de unicidade (email/username)
 * - Lógica de negócio centralizada
 * - Integração com repositório
 * - Tratamento de erros específicos
 * - Auditoria automática
 * - Verificação de senha atual
 *
 * SEGURANÇA:
 * - Senhas são hasheadas com bcrypt (salt rounds: 12)
 * - Validação de senha atual antes de alterar
 * - Verificação de unicidade antes de criar/atualizar
 * - Senhas nunca são retornadas em consultas
 *
 * COMO USAR:
 * ```typescript
 * const service = new UserService();
 * const user = await service.create(userData, currentUserId);
 * const users = await service.list(filterParams);
 * await service.changePassword(userId, passwordData, currentUserId);
 * const isValid = await service.verifyPassword(username, password);
 * ```
 */

import { User } from '@nexa-oper/db';
import bcrypt from 'bcryptjs';
import { AbstractCrudService } from '../abstracts/AbstractCrudService';
import { UserRepository } from '../repositories/UserRepository';
import {
  userChangePasswordSchema,
  UserCreate,
  UserCreateData,
  userCreateSchema,
  UserFilter,
  userFilterSchema,
  UserSafe,
  UserUpdate,
  UserUpdateData,
  userUpdateSchema
} from '../schemas/userSchema';
import { PaginatedResult } from '../types/common';

export class UserService extends AbstractCrudService<
  UserCreate,
  UserUpdate,
  UserFilter,
  User
> {
  private userRepo: UserRepository;
  private readonly saltRounds = 12; // Número de rounds para bcrypt

  /**
   * Construtor do serviço
   *
   * Inicializa o repositório e registra o serviço no container
   */
  constructor() {
    const repo = new UserRepository();
    super(repo);
    this.userRepo = repo;
  }

  /**
   * Cria um novo usuário
   *
   * @param raw - Dados brutos do usuário
   * @param userId - ID do usuário que está criando
   * @returns Usuário criado (sem senha)
   */
  async create(raw: unknown, userId: string): Promise<User> {
    // Valida os dados de entrada
    const data = userCreateSchema.parse(raw);

    // Validações de negócio
    await this.validateEmailUnique(data.email);
    await this.validateUsernameUnique(data.username);

    // Hash da senha
    const hashedPassword = await this.hashPassword(data.password);

    // Remove confirmPassword e adiciona senha hasheada
    const { confirmPassword, ...createData } = data;
    const userCreateData: UserCreateData = {
      ...createData,
      password: hashedPassword,
    };

    return this.userRepo.create(userCreateData, userId);
  }

  /**
   * Atualiza um usuário existente
   *
   * @param raw - Dados brutos do usuário
   * @param userId - ID do usuário que está atualizando
   * @returns Usuário atualizado (sem senha)
   */
  async update(raw: unknown, userId: string): Promise<User> {
    // Valida os dados de entrada
    const data = userUpdateSchema.parse(raw);
    const { id, confirmPassword, ...updateFields } = data;

    // Verifica se o usuário existe
    const existingUser = await this.userRepo.findById(id);
    if (!existingUser) {
      throw new Error('Usuário não encontrado');
    }

    // Validações de unicidade (excluindo o próprio usuário)
    if (updateFields.email) {
      await this.validateEmailUnique(updateFields.email, id);
    }
    if (updateFields.username) {
      await this.validateUsernameUnique(updateFields.username, id);
    }

    // Prepara dados para atualização
    const userUpdateData: UserUpdateData = { ...updateFields };

    // Hash da senha se foi fornecida
    if (updateFields.password) {
      userUpdateData.password = await this.hashPassword(updateFields.password);
    }

    return this.userRepo.update(id, userUpdateData, userId);
  }

  /**
   * Altera a senha de um usuário
   *
   * @param raw - Dados da alteração de senha
   * @param userId - ID do usuário que está alterando
   * @returns Usuário atualizado (sem senha)
   */
  async changePassword(raw: unknown, userId: string): Promise<User> {
    // Valida os dados de entrada
    const data = userChangePasswordSchema.parse(raw);

    // Busca o usuário com senha para verificação
    const user = await this.userRepo.findByIdWithPassword(data.id);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Verifica se a senha atual está correta
    const isCurrentPasswordValid = await bcrypt.compare(data.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error('Senha atual incorreta');
    }

    // Hash da nova senha
    const hashedNewPassword = await this.hashPassword(data.newPassword);

    // Atualiza apenas a senha
    return this.userRepo.update(
      data.id,
      { password: hashedNewPassword },
      userId
    );
  }

  /**
   * Verifica se as credenciais de login são válidas
   *
   * @param username - Username ou email
   * @param password - Senha em texto plano
   * @returns Usuário se válido, null caso contrário
   */
  async verifyCredentials(username: string, password: string): Promise<UserSafe | null> {
    // Tenta buscar por username primeiro, depois por email
    let user = await this.userRepo.findByUsernameWithPassword(username);
    if (!user) {
      user = await this.userRepo.findByEmailWithPassword(username);
    }

    if (!user) {
      return null;
    }

    // Verifica a senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // Remove a senha do retorno
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as UserSafe;
  }

  /**
   * Exclui um usuário (soft delete)
   *
   * @param id - ID do usuário
   * @param userId - ID do usuário que está excluindo
   * @returns Usuário excluído
   */
  async delete(id: number, userId: string): Promise<User> {
    // Verifica se o usuário existe
    const existingUser = await this.userRepo.findById(id);
    if (!existingUser) {
      throw new Error('Usuário não encontrado');
    }

    // Não permite que o usuário delete a si mesmo
    if (id.toString() === userId) {
      throw new Error('Não é possível excluir seu próprio usuário');
    }

    return this.userRepo.delete(id, userId);
  }

  /**
   * Busca um usuário por ID
   *
   * @param id - ID do usuário
   * @returns Usuário encontrado ou null
   */
  async getById(id: number): Promise<User | null> {
    return this.userRepo.findById(id);
  }

  /**
   * Lista usuários com paginação
   *
   * @param params - Parâmetros de paginação e filtro
   * @returns Resultado paginado
   */
  async list(params: UserFilter): Promise<PaginatedResult<User>> {
    // Valida os parâmetros
    const validatedParams = userFilterSchema.parse(params);

    const { items, total } = await this.userRepo.list(validatedParams);
    const totalPages = Math.ceil(total / validatedParams.pageSize);

    return {
      data: items,
      total,
      totalPages,
      page: validatedParams.page,
      pageSize: validatedParams.pageSize,
    };
  }

  /**
   * Lista usuários ativos
   *
   * @returns Array de usuários ativos
   */
  async getActiveUsers(): Promise<UserSafe[]> {
    return this.userRepo.findActive();
  }

  /**
   * Busca usuários por nome
   *
   * @param nome - Nome para buscar
   * @returns Array de usuários encontrados
   */
  async searchByName(nome: string): Promise<UserSafe[]> {
    if (!nome || nome.trim().length < 2) {
      throw new Error('Nome deve ter pelo menos 2 caracteres');
    }

    return this.userRepo.findByNome(nome.trim());
  }

  /**
   * Hash de uma senha usando bcrypt
   *
   * @param password - Senha em texto plano
   * @returns Senha hasheada
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Valida se um email é único
   *
   * @param email - Email para validar
   * @param excludeId - ID para excluir da validação (opcional)
   */
  private async validateEmailUnique(email: string, excludeId?: number): Promise<void> {
    const exists = await this.userRepo.emailExists(email, excludeId);
    if (exists) {
      throw new Error('Este email já está em uso por outro usuário');
    }
  }

  /**
   * Valida se um username é único
   *
   * @param username - Username para validar
   * @param excludeId - ID para excluir da validação (opcional)
   */
  private async validateUsernameUnique(username: string, excludeId?: number): Promise<void> {
    const exists = await this.userRepo.usernameExists(username, excludeId);
    if (exists) {
      throw new Error('Este username já está em uso por outro usuário');
    }
  }

  /**
   * Define os campos que podem ser utilizados para busca
   *
   * @returns Array com os nomes dos campos de busca
   */
  protected getSearchFields(): string[] {
    return ['nome', 'email', 'username'];
  }
}
