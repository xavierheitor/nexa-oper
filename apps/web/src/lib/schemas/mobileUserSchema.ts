/**
 * Schemas de Validação para MobileUser
 *
 * Este arquivo define todos os schemas Zod para validação de dados
 * relacionados aos usuários móveis, incluindo criação, atualização,
 * alteração de senha e filtragem.
 *
 * FUNCIONALIDADES:
 * - Validação de criação com senha forte obrigatória
 * - Validação de atualização com campos opcionais
 * - Schema específico para alteração de senha
 * - Schema para filtros de busca com includes dinâmicos
 * - Tipos TypeScript derivados dos schemas
 *
 * PADRÕES DE VALIDAÇÃO:
 * - Username: 3-255 caracteres, apenas letras, números e símbolos permitidos
 * - Senha: mínimo 8 caracteres com requisitos de força
 * - Confirmação de senha obrigatória na criação
 * - Validação cruzada entre senha e confirmação
 *
 * INTEGRAÇÃO:
 * - Compatível com Prisma MobileUser model
 * - Suporte a includes dinâmicos para relacionamentos
 * - Types exportados para uso em toda aplicação
 * - Validação automática via Server Actions
 */

import { z } from 'zod';

/**
 * Schema para criação de usuário móvel
 *
 * Inclui validação rigorosa de senha e confirmação obrigatória.
 * A senha deve atender critérios de segurança específicos.
 */
export const mobileUserCreateSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username é obrigatório')
      .max(255, 'Username muito longo')
      .regex(/^[a-zA-Z0-9_.-]+$/, 'Username inválido'),
    password: z
      .string()
      .min(8, 'Senha deve ter no mínimo 8 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=(.*\d){1,})(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        'Senha deve conter pelo menos: 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

/**
 * Schema para atualização de usuário móvel
 *
 * Todos os campos são opcionais, permitindo atualizações parciais.
 * Inclui validação condicional de senha quando fornecida.
 */
export const mobileUserUpdateSchema = z
  .object({
    id: z.number().int().positive(),
    username: z
      .string()
      .min(3, 'Username é obrigatório')
      .max(255, 'Username muito longo')
      .regex(/^[a-zA-Z0-9_.-]+$/, 'Username inválido')
      .optional(),
    password: z
      .string()
      .min(8, 'Senha deve ter no mínimo 8 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=(.*\d){1,})(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        'Senha deve conter pelo menos: 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial'
      )
      .optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      // Se senha foi fornecida, confirmação é obrigatória
      if (data.password && !data.confirmPassword) {
        return false;
      }
      // Se ambas foram fornecidas, devem coincidir
      if (data.password && data.confirmPassword) {
        return data.password === data.confirmPassword;
      }
      return true;
    },
    {
      message: 'As senhas não coincidem',
      path: ['confirmPassword'],
    }
  );

/**
 * Schema para alteração de senha de usuário móvel
 *
 * Usado em operações específicas de mudança de senha,
 * requerendo senha atual para validação de segurança.
 */
export const mobileUserChangePasswordSchema = z
  .object({
    id: z.number().int().positive(),
    currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
    newPassword: z
      .string()
      .min(8, 'Nova senha deve ter no mínimo 8 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=(.*\d){1,})(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        'Nova senha deve conter pelo menos: 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial'
      ),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmNewPassword'],
  });

/**
 * Schema para filtros de busca de usuários móveis
 *
 * Suporte a busca textual e includes dinâmicos para relacionamentos.
 * Compatível com o sistema de paginação e filtros da aplicação.
 */
export const mobileUserFilterSchema = z.object({
  search: z.string().optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  include: z.any().optional(), // Para includes dinâmicos
});

// ========================================
// TIPOS DERIVADOS DOS SCHEMAS
// ========================================

/**
 * Tipo para dados de criação de usuário móvel
 * Derivado do schema de criação
 */
export type MobileUserCreate = z.infer<typeof mobileUserCreateSchema>;

/**
 * Tipo para dados de atualização de usuário móvel
 * Derivado do schema de atualização
 */
export type MobileUserUpdate = z.infer<typeof mobileUserUpdateSchema>;

/**
 * Tipo para dados de alteração de senha
 * Derivado do schema de alteração de senha
 */
export type MobileUserChangePassword = z.infer<typeof mobileUserChangePasswordSchema>;

/**
 * Tipo para filtros de busca
 * Derivado do schema de filtros
 */
export type MobileUserFilter = z.infer<typeof mobileUserFilterSchema>;

/**
 * Tipo para dados de criação no Prisma
 * Remove campos de confirmação que não existem no modelo
 */
export type MobileUserCreateData = Omit<MobileUserCreate, 'confirmPassword'>;

/**
 * Tipo para dados de atualização no Prisma
 * Remove campos de confirmação que não existem no modelo
 */
export type MobileUserUpdateData = Omit<MobileUserUpdate, 'confirmPassword'>;

/**
 * Tipo para usuário móvel sem senha (para retorno seguro)
 * Remove a senha dos dados retornados para o frontend
 */
export type MobileUserSafe = {
  id: number;
  username: string;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date | null;
  updatedBy: string | null;
  deletedAt: Date | null;
  deletedBy: string | null;
};
