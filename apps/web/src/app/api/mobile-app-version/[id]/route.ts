import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/db.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/utils/auth.config';
import { PERMISSIONS } from '@/lib/authz/permissions';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (
    !(session.user.permissions ?? []).includes(
      PERMISSIONS.MOBILE_APP_VERSION_MANAGE
    )
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  await prisma.mobileAppVersion.delete({ where: { id } });
  
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (
    !(session.user.permissions ?? []).includes(
      PERMISSIONS.MOBILE_APP_VERSION_MANAGE
    )
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  const version = await prisma.mobileAppVersion.findUnique({ where: { id } });
  if (!version) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

  const result = await prisma.$transaction(async (tx: any) => {
    await tx.mobileAppVersion.updateMany({
      where: { plataforma: version.plataforma },
      data: { ativo: false },
    });

    return tx.mobileAppVersion.update({
      where: { id },
      data: { ativo: true },
    });
  });

  return NextResponse.json(result);
}
