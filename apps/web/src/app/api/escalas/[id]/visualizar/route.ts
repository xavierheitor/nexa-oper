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
      where: { id: escalaId, deletedAt: null },
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
          where: {
            deletedAt: null,
          },
          orderBy: { data: 'asc' },
          include: {
            eletricista: {
              select: {
                id: true,
                nome: true,
                matricula: true,
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
    const eletricistasUnicos = new Set(escala.Slots.map(s => s.eletricistaId));
    console.log('Escala encontrada:', {
      id: escala.id,
      slots: escala.Slots.length,
      eletricistas: eletricistasUnicos.size,
      diasComTrabalho: escala.Slots.filter(s => s.estado === 'TRABALHO').length,
      diasComFolga: escala.Slots.filter(s => s.estado === 'FOLGA').length,
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

