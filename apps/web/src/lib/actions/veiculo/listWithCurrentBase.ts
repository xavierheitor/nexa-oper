// ARQUIVO COMENTADO - Usa @clerk/nextjs/server que não está instalado
// TODO: Migrar para next-auth ou remover se não for necessário

/*
'use server';

import { prisma } from '@/lib/db/db.service';
// import { auth } from '@clerk/nextjs/server';

export async function listVeiculosWithCurrentBase(params: {
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
        { placa: { contains: search, mode: 'insensitive' } },
        { modelo: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Buscar veículos com relacionamentos
    const [veiculos, total] = await Promise.all([
      prisma.veiculo.findMany({
        where: whereClause,
        include: {
          tipoVeiculo: true,
          contrato: true,
        },
        orderBy: orderBy === 'id' ? { id: orderDir } : { [orderBy]: orderDir },
        skip,
        take: pageSize,
      }),
      prisma.veiculo.count({ where: whereClause }),
    ]);

    // Para cada veículo, buscar sua base atual
    const veiculosWithBase = await Promise.all(
      veiculos.map(async (veiculo) => {
        try {
          const currentBase = await prisma.veiculoBaseHistorico.findFirst({
            where: {
              veiculoId: veiculo.id,
              dataFim: null, // Base ativa
            },
            include: {
              base: true,
            },
          });

          return {
            ...veiculo,
            baseAtual: currentBase?.base || null,
          };
        } catch (error) {
          console.error(`Erro ao buscar base para veículo ${veiculo.id}:`, error);
          return {
            ...veiculo,
            baseAtual: null,
          };
        }
      })
    );

    return {
      success: true,
      data: {
        data: veiculosWithBase,
        meta: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    };
  } catch (error) {
    console.error('Erro ao listar veículos com base atual:', error);
    return { success: false, error: 'Erro ao listar veículos.' };
  }
}
*/
