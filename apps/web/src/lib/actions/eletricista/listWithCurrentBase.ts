'use server';

import { prisma } from '@/lib/db/db.service';
import { auth } from '@clerk/nextjs/server';

export async function listEletricistasWithCurrentBase(params: {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
  search?: string;
}) {
  const { userId } = auth();
  if (!userId) {
    return { success: false, error: 'Usuário não autenticado.' };
  }

  try {
    const {
      page = 1,
      pageSize = 10,
      orderBy = 'id',
      orderDir = 'desc',
      search,
    } = params;

    const skip = (page - 1) * pageSize;

    // Construir filtros de busca
    const whereClause: any = {
      deletedAt: null,
    };

    if (search) {
      whereClause.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { matricula: { contains: search, mode: 'insensitive' } },
        { telefone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Buscar eletricistas com relacionamentos
    const [eletricistas, total] = await Promise.all([
      prisma.eletricista.findMany({
        where: whereClause,
        include: {
          contrato: true,
        },
        orderBy: orderBy === 'id' ? { id: orderDir } : { [orderBy]: orderDir },
        skip,
        take: pageSize,
      }),
      prisma.eletricista.count({ where: whereClause }),
    ]);

    // Para cada eletricista, buscar sua base atual
    const eletricistasWithBase = await Promise.all(
      eletricistas.map(async (eletricista) => {
        try {
          const currentBase = await prisma.eletricistaBaseHistorico.findFirst({
            where: {
              eletricistaId: eletricista.id,
              dataFim: null, // Base ativa
            },
            include: {
              base: true,
            },
          });

          return {
            ...eletricista,
            baseAtual: currentBase?.base || null,
          };
        } catch (error) {
          console.error(`Erro ao buscar base para eletricista ${eletricista.id}:`, error);
          return {
            ...eletricista,
            baseAtual: null,
          };
        }
      })
    );

    return {
      success: true,
      data: {
        data: eletricistasWithBase,
        meta: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    };
  } catch (error) {
    console.error('Erro ao listar eletricistas com base atual:', error);
    return { success: false, error: 'Erro ao listar eletricistas.' };
  }
}
