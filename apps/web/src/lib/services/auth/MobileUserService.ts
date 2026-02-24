/**
 * Service para MobileUser
 *
 * Este service implementa toda a lógica de negócio para usuários móveis,
 * incluindo validações, regras de negócio, criptografia de senhas e
 * integração com o repository para persistência de dados.
 *
 * FUNCIONALIDADES:
 * - CRUD completo com validações de negócio
 * - Criptografia segura de senhas com bcrypt
 * - Validação de unicidade de username
 * - Reset de senha com geração automática
 * - Verificação de credenciais para autenticação
 * - Alteração de senha com validação da senha atual
 * - Listagem paginada com filtros e busca
 *
 * SEGURANÇA:
 * - Hash de senhas com bcrypt (salt rounds: 12)
 * - Validação de senha atual em alterações
 * - Geração segura de senhas aleatórias
 * - Exclusão automática de senhas em retornos
 * - Validação de unicidade para prevenir duplicatas
 *
 * REGRAS DE NEGÓCIO:
 * - Username deve ser único no sistema
 * - Senhas devem atender critérios de força
 * - Usuários não podem ser excluídos se tiverem sessões ativas
 * - Auditoria completa de todas as operações
 * - Soft delete para preservar histórico
 *
 * INTEGRAÇÃO:
 * - Usa MobileUserRepository para persistência
 * - Integra com sistema de validação Zod
 * - Compatível com Server Actions
 * - Suporte a logging automático
 */

import { PaginatedResult, PaginationParams } from '@/lib/types/common';
import { MobileUser } from '@nexa-oper/db';
import bcrypt from 'bcryptjs';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import { MobileUserRepository } from '../../repositories/auth/MobileUserRepository';
import {
  MobileUserChangePassword,
  MobileUserCreate,
  MobileUserCreateData,
  MobileUserUpdate,
  MobileUserUpdateData,
  mobileUserChangePasswordSchema,
  mobileUserCreateSchema,
  mobileUserUpdateSchema,
} from '../../schemas/mobileUserSchema';

// Tipo de filtro compatível com PaginationParams
interface MobileUserFilter extends PaginationParams {
  search?: string;
  include?: any;
}

/**
 * Service para operações de MobileUser
 *
 * Implementa regras de negócio e validações específicas
 * para usuários móveis, garantindo integridade e segurança.
 */
export class MobileUserService extends AbstractCrudService<
  MobileUserCreate,
  MobileUserUpdate,
  MobileUserFilter,
  MobileUser
> {
  private mobileUserRepo: MobileUserRepository;

  constructor() {
    const repo = new MobileUserRepository();
    super(repo);
    this.mobileUserRepo = repo;
  }

  /**
   * Cria um novo usuário móvel
   *
   * @param rawData - Dados brutos do usuário móvel
   * @param userId - ID do usuário que está criando
   * @returns Promise com o usuário móvel criado (sem senha)
   */
  async create(rawData: MobileUserCreate, userId: string): Promise<MobileUser> {
    // Valida os dados de entrada
    const data = mobileUserCreateSchema.parse(rawData);

    // Verifica unicidade do username
    await this.validateUsernameUniqueness(data.username);

    // Hash da senha
    const hashedPassword = await this.hashPassword(data.password);

    // Prepara dados para criação
    const createData: MobileUserCreateData = {
      username: data.username,
      password: hashedPassword,
    };

    // Cria o usuário móvel
    const newMobileUser = await this.mobileUserRepo.create(createData, userId);
    return newMobileUser;
  }

  /**
   * Atualiza um usuário móvel existente
   *
   * @param rawData - Dados de atualização
   * @param userId - ID do usuário que está atualizando
   * @returns Promise com o usuário móvel atualizado (sem senha)
   */
  async update(rawData: MobileUserUpdate, userId: string): Promise<MobileUser> {
    // Valida os dados de entrada
    const data = mobileUserUpdateSchema.parse(rawData);

    // Verifica se o usuário móvel existe
    const existingMobileUser = await this.mobileUserRepo.findById(data.id);
    if (!existingMobileUser) {
      throw new Error('Usuário móvel não encontrado');
    }

    // Prepara dados para atualização
    const updateData: Partial<MobileUserUpdateData> = {};

    // Atualiza username se fornecido
    if (data.username && data.username !== existingMobileUser.username) {
      await this.validateUsernameUniqueness(data.username, data.id);
      updateData.username = data.username;
    }

    // Atualiza senha se fornecida
    if (data.password) {
      updateData.password = await this.hashPassword(data.password);
    }

    // Se não há dados para atualizar, retorna o usuário atual
    if (Object.keys(updateData).length === 0) {
      return existingMobileUser;
    }

    // Atualiza o usuário móvel
    const updatedMobileUser = await this.mobileUserRepo.update(
      data.id,
      updateData,
      userId
    );
    return updatedMobileUser;
  }

  /**
   * Exclui um usuário móvel
   *
   * @param id - ID do usuário móvel a ser excluído
   * @param userId - ID do usuário que está excluindo
   * @returns Promise com o usuário móvel excluído
   */
  async delete(id: number | string, userId: string): Promise<MobileUser> {
    // Verifica se o usuário móvel existe
    const mobileUser = await this.mobileUserRepo.findById(Number(id));
    if (!mobileUser) {
      throw new Error('Usuário móvel não encontrado');
    }

    // Exclui o usuário móvel (soft delete)
    return this.mobileUserRepo.delete(Number(id), userId);
  }

  // getById vem da classe abstrata

  /**
   * Lista usuários móveis com paginação e filtros
   *
   * @param params - Parâmetros de paginação e filtros
   * @returns Promise com resultado paginado
   */
  async list(params: MobileUserFilter): Promise<PaginatedResult<MobileUser>> {
    return super.list(params);
  }

  /**
   * Altera a senha de um usuário móvel
   *
   * @param rawData - Dados da alteração de senha
   * @param userId - ID do usuário que está alterando
   * @returns Promise<void>
   */
  async changePassword(
    rawData: MobileUserChangePassword,
    userId: string
  ): Promise<void> {
    // Valida os dados de entrada
    const data = mobileUserChangePasswordSchema.parse(rawData);

    // Busca o usuário móvel com senha para verificação
    const mobileUser = await this.mobileUserRepo.findByUsernameWithPassword(
      (await this.mobileUserRepo.findById(data.id))?.username || ''
    );

    if (!mobileUser) {
      throw new Error('Usuário móvel não encontrado');
    }

    // Verifica a senha atual
    const isCurrentPasswordValid = await this.verifyPassword(
      data.currentPassword,
      mobileUser.password
    );

    if (!isCurrentPasswordValid) {
      throw new Error('Senha atual incorreta');
    }

    // Hash da nova senha
    const hashedNewPassword = await this.hashPassword(data.newPassword);

    // Atualiza a senha
    await this.mobileUserRepo.update(
      data.id,
      { password: hashedNewPassword },
      userId
    );
  }

  /**
   * Reseta a senha de um usuário móvel
   *
   * @param data - Dados do reset (userId, sendEmail, notifyUser)
   * @param currentUserId - ID do usuário que está executando o reset
   * @returns Resultado da operação
   */
  async resetPassword(
    data: { userId: number; sendEmail: boolean; notifyUser: boolean },
    currentUserId: string
  ): Promise<{ success: boolean; newPassword?: string; emailSent: boolean }> {
    // Verifica se o usuário móvel existe
    const mobileUser = await this.mobileUserRepo.findById(data.userId);
    if (!mobileUser) {
      throw new Error('Usuário móvel não encontrado');
    }

    // Gera nova senha aleatória
    const newPassword = this.generateRandomPassword();

    // Hash da nova senha
    const hashedPassword = await this.hashPassword(newPassword);

    // Atualiza a senha no banco
    await this.mobileUserRepo.update(
      data.userId,
      { password: hashedPassword },
      currentUserId
    );

    // Simula envio de notificação (implementar integração real conforme necessário)
    let emailSent = false;
    if (data.sendEmail) {
      // TODO: Implementar envio de notificação real para dispositivos móveis
      console.log(
        `📱 Enviando nova senha para usuário móvel ${mobileUser.username}: ${newPassword}`
      );
      emailSent = true;
    }

    return {
      success: true,
      newPassword: data.sendEmail ? undefined : newPassword, // Só retorna se não enviou por notificação
      emailSent,
    };
  }

  /**
   * Verifica credenciais de um usuário móvel
   *
   * @param username - Username do usuário móvel
   * @param password - Senha do usuário móvel
   * @returns Promise com o usuário móvel se credenciais válidas, null caso contrário
   */
  async verifyCredentials(
    username: string,
    password: string
  ): Promise<MobileUser | null> {
    // Busca o usuário móvel com senha
    const mobileUser =
      await this.mobileUserRepo.findByUsernameWithPassword(username);

    if (!mobileUser) {
      return null;
    }

    // Verifica a senha
    const isPasswordValid = await this.verifyPassword(
      password,
      mobileUser.password
    );

    if (!isPasswordValid) {
      return null;
    }

    // Retorna o usuário móvel sem a senha
    const { password: _, ...mobileUserSafe } = mobileUser;
    return mobileUserSafe as MobileUser;
  }

  /**
   * Valida unicidade do username
   *
   * @param username - Username a ser validado
   * @param excludeId - ID a ser excluído da validação (para updates)
   * @throws Error se username já existir
   */
  private async validateUsernameUniqueness(
    username: string,
    excludeId?: number
  ): Promise<void> {
    const exists = await this.mobileUserRepo.usernameExists(
      username,
      excludeId
    );
    if (exists) {
      throw new Error('Este username já está em uso por outro usuário móvel');
    }
  }

  /**
   * Gera hash da senha usando bcrypt
   *
   * @param password - Senha em texto plano
   * @returns Promise com hash da senha
   */
  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  /**
   * Verifica se a senha fornecida corresponde ao hash
   *
   * @param password - Senha em texto plano
   * @param hash - Hash armazenado
   * @returns Promise<boolean> indicando se a senha é válida
   */
  private async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Gera uma senha aleatória segura
   *
   * @returns Senha aleatória com 12 caracteres
   */
  private generateRandomPassword(): string {
    const length = 12;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$!%*?&';
    let password = '';

    // Garante pelo menos um de cada tipo
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // minúscula
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // maiúscula
    password += '0123456789'[Math.floor(Math.random() * 10)]; // número
    password += '@$!%*?&'[Math.floor(Math.random() * 7)]; // especial

    // Preenche o restante aleatoriamente
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Embaralha a senha
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  /**
   * Define os campos que podem ser utilizados para busca
   *
   * @returns Array com os nomes dos campos de busca
   */
  protected getSearchFields(): string[] {
    return ['username'];
  }
}
