/**
 * Schemas de Validação para Usuários Web
 *
 * Define os schemas Zod para validação de dados de entrada
 * em operações CRUD de usuários, incluindo validação de senhas
 * com confirmação e critérios de segurança.
 *
 * FUNCIONALIDADES:
 * - Validação de email único
 * - Validação de username único
 * - Validação de senha segura
 * - Confirmação de senha obrigatória
 * - Validação de nome completo
 * - Filtros e paginação
 * - Includes dinâmicos para relacionamentos
 *
 * CRITÉRIOS DE SENHA:
 * - Mínimo 8 caracteres
 * - Pelo menos 1 letra maiúscula
 * - Pelo menos 1 letra minúscula
 * - Pelo menos 1 número
 * - Pelo menos 1 caractere especial
 */

import { z } from 'zod';
import type { IncludeConfig } from '../types/common';

// Regex para validação de senha forte
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

// Schema base para senha
const passwordSchema = z
  .string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres')
  .max(255, 'Senha deve ter no máximo 255 caracteres')
  .regex(
    passwordRegex,
    'Senha deve conter pelo menos: 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial'
  );

// Schema para criação de usuário
export const userCreateSchema = z
  .object({
    nome: z
      .string()
      .min(2, 'Nome deve ter no mínimo 2 caracteres')
      .max(255, 'Nome deve ter no máximo 255 caracteres')
      .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),

    email: z
      .string()
      .min(1, 'Email é obrigatório')
      .max(255, 'Email deve ter no máximo 255 caracteres')
      .email('Formato de email inválido')
      .toLowerCase(),

    username: z
      .string()
      .min(3, 'Username deve ter no mínimo 3 caracteres')
      .max(255, 'Username deve ter no máximo 255 caracteres')
      .regex(/^[a-zA-Z0-9_.-]+$/, 'Username deve conter apenas letras, números, pontos, hífens e underscores')
      .toLowerCase(),

    password: passwordSchema,

    confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

// Schema para atualização (senha opcional)
export const userUpdateSchema = z
  .object({
    id: z.number().int().positive('ID deve ser um número inteiro positivo'),

    nome: z
      .string()
      .min(2, 'Nome deve ter no mínimo 2 caracteres')
      .max(255, 'Nome deve ter no máximo 255 caracteres')
      .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços')
      .optional(),

    email: z
      .string()
      .max(255, 'Email deve ter no máximo 255 caracteres')
      .email('Formato de email inválido')
      .toLowerCase()
      .optional(),

    username: z
      .string()
      .min(3, 'Username deve ter no mínimo 3 caracteres')
      .max(255, 'Username deve ter no máximo 255 caracteres')
      .regex(/^[a-zA-Z0-9_.-]+$/, 'Username deve conter apenas letras, números, pontos, hífens e underscores')
      .toLowerCase()
      .optional(),

    password: passwordSchema.optional(),

    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      // Se password foi fornecido, confirmPassword também deve ser
      if (data.password && !data.confirmPassword) {
        return false;
      }
      // Se ambos foram fornecidos, devem ser iguais
      if (data.password && data.confirmPassword) {
        return data.password === data.confirmPassword;
      }
      // Se nenhum foi fornecido, está ok
      return true;
    },
    {
      message: 'As senhas não coincidem',
      path: ['confirmPassword'],
    }
  );

// Schema para alteração de senha
export const userChangePasswordSchema = z
  .object({
    id: z.number().int().positive('ID deve ser um número inteiro positivo'),

    currentPassword: z.string().min(1, 'Senha atual é obrigatória'),

    newPassword: passwordSchema,

    confirmNewPassword: z.string().min(1, 'Confirmação da nova senha é obrigatória'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'As novas senhas não coincidem',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'A nova senha deve ser diferente da atual',
    path: ['newPassword'],
  });

// Schema para filtros e listagem
export const userFilterSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(10),
  orderBy: z.string().default('nome'),
  orderDir: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().optional(),
  ativo: z.boolean().optional(), // Para filtrar por usuários não deletados
  include: z.custom<IncludeConfig>().optional(), // Para includes dinâmicos
});

// Schema para login (referência)
export const userLoginSchema = z.object({
  username: z.string().min(1, 'Username é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

// Tipos derivados dos schemas
export type UserCreate = z.infer<typeof userCreateSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type UserChangePassword = z.infer<typeof userChangePasswordSchema>;
export type UserFilter = z.infer<typeof userFilterSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;

// Tipo para dados do usuário (sem senha)
export type UserSafe = {
  id: number;
  nome: string;
  email: string;
  username: string;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date | null;
  updatedBy: string | null;
  deletedAt: Date | null;
  deletedBy: string | null;
};

// Tipo para criação sem confirmPassword (uso interno)
export type UserCreateData = Omit<UserCreate, 'confirmPassword'>;
export type UserUpdateData = Omit<UserUpdate, 'confirmPassword' | 'id'>;
