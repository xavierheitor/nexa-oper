'use server';

import { prisma } from '@/lib/db/db.service';

export async function getEletricistaCurrentBase(eletricistaId: number) {
  const { userId } = auth();
  if (!userId) {
    return { success: false, error: 'Usuário não autenticado.' };
  }

  try {
    const currentBase = await prisma.eletricistaBaseHistorico.findFirst({
      where: {
        eletricistaId: eletricistaId,
        dataFim: null, // Base ativa (sem data de fim)
      },
      include: {
        base: true,
      },
    });

    return {
      success: true,
      data: currentBase?.base || null
    };
  } catch (error) {
    console.error('Erro ao buscar base atual do eletricista:', error);
    return { success: false, error: 'Erro ao buscar base atual do eletricista.' };
  }
}
function auth(): { userId: any; } {
  throw new Error('Function not implemented.');
}

