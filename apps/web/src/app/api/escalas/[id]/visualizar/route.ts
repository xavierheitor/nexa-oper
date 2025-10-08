/**
 * API Route para visualização de escala
 */

import { prisma } from '@/lib/db/db.service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const escalaId = Number(resolvedParams.id);

    const escala = await prisma.escalaEquipePeriodo.findUnique({
      where: { id: escalaId },
      include: {
        equipe: {
          select: {
            nome: true,
          },
        },
        tipoEscala: {
          select: {
            nome: true,
          },
        },
        Slots: {
          orderBy: { data: 'asc' },
          include: {
            Atribuicoes: {
              where: {
                deletedAt: null,
              },
              include: {
                eletricista: {
                  select: {
                    id: true,
                    nome: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!escala) {
      return NextResponse.json(
        { success: false, error: 'Escala não encontrada' },
        { status: 404 }
      );
    }

    // Log para debug
    console.log('Escala encontrada:', {
      id: escala.id,
      slots: escala.Slots.length,
      totalAtribuicoes: escala.Slots.reduce((sum, s) => sum + s.Atribuicoes.length, 0),
      atribuicoesPorSlot: escala.Slots.map(s => ({
        data: s.data,
        qtd: s.Atribuicoes.length,
        eletricistas: s.Atribuicoes.map(a => a.eletricista.nome)
      }))
    });

    return NextResponse.json({
      success: true,
      data: escala,
    });
  } catch (error) {
    console.error('Erro ao buscar escala:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar escala' },
      { status: 500 }
    );
  }
}

