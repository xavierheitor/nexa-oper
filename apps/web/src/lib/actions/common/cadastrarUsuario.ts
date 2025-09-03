'use server';

import { dbService } from '@/lib/db/db.service';
import bcrypt from 'bcrypt';
export async function cadastrarUsuario(formData: FormData) {
  const username = formData.get('username')?.toString();
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();
  const name = formData.get('name')?.toString();

  if (!username || !password || !name) {
    return {
      success: false,
      message: 'Preencha todos os campos obrigatórios.',
    };
  }

  const existing = await dbService.getPrisma().user.findUnique({ where: { username } });
  if (existing) {
    return { success: false, message: 'Usuário já existe.' };
  }

  const hashed = await bcrypt.hash(password, 10);

  await dbService.getPrisma().user.create({
    data: {
      username,
      email: email ?? '',
      password: hashed,
      nome: name ?? '',
      createdBy: 'system',
    },
  });

  return { success: true, message: 'Usuário cadastrado com sucesso!' };
}
