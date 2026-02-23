'use server';

import { PERMISSIONS } from '@/lib/types/permissions';
import { prisma } from '@/lib/db/db.service';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { handleServerAction } from './actionHandler';

const cadastrarUsuarioSchema = z.object({
  username: z.string().trim().min(1, 'Usuário é obrigatório'),
  email: z
    .string()
    .trim()
    .email('E-mail inválido')
    .optional()
    .or(z.literal('')),
  password: z.string().min(1, 'Senha é obrigatória'),
  name: z.string().trim().min(1, 'Nome é obrigatório'),
});

export const cadastrarUsuario = async (rawData: unknown) =>
  handleServerAction(
    cadastrarUsuarioSchema,
    async (data, session) => {
      const hasPermission =
        session.user.roles.includes('admin') ||
        session.user.permissions.includes(PERMISSIONS.USERS_CREATE) ||
        session.user.permissions.includes(PERMISSIONS.USUARIO_MANAGE);

      if (!hasPermission) {
        throw new Error('Sem permissão para cadastrar usuários.');
      }

      const existing = await prisma.user.findUnique({
        where: { username: data.username },
      });

      if (existing) {
        throw new Error('Usuário já existe.');
      }

      if (data.email) {
        const existingEmail = await prisma.user.findFirst({
          where: { email: data.email },
        });

        if (existingEmail) {
          throw new Error('E-mail já está em uso.');
        }
      }

      const hashed = await bcrypt.hash(data.password, 10);

      const created = await prisma.user.create({
        data: {
          username: data.username,
          email: data.email ?? '',
          password: hashed,
          nome: data.name,
          createdBy: session.user.id,
        },
      });

      return {
        id: created.id,
      };
    },
    rawData,
    { entityName: 'User', actionType: 'create' }
  );
