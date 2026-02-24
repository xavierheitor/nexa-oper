import { listTiposEquipe } from '@/lib/actions/tipoEquipe/list';
import type { PaginatedResult } from '@/lib/types/common';
import TipoEquipePageClient from '@/ui/pages/dashboard/cadastro/TipoEquipePageClient';
import { TipoEquipe } from '@nexa-oper/db';
import { redirect } from 'next/navigation';

export default async function TipoEquipePage() {
  const result = await listTiposEquipe({
    page: 1,
    pageSize: 10,
    orderBy: 'id',
    orderDir: 'desc',
  });

  if (result.redirectToLogin) {
    redirect('/login');
  }

  const initialData: PaginatedResult<TipoEquipe> | undefined =
    result.success && result.data ? result.data : undefined;

  return <TipoEquipePageClient initialData={initialData} />;
}
