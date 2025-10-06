'use server';

import { prisma } from '@/lib/db/db.service';

export async function getVeiculoCurrentBase(veiculoId: number) {
  const { userId } = auth();
  if (!userId) {
    return { success: false, error: 'Usuário não autenticado.' };
  }

  try {
    const currentBase = await prisma.veiculoBaseHistorico.findFirst({
      where: {
        veiculoId: veiculoId,
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
    console.error('Erro ao buscar base atual do veículo:', error);
    return { success: false, error: 'Erro ao buscar base atual do veículo.' };
  }
}
function auth(): { userId: any; } {
  throw new Error('Function not implemented.');
}

