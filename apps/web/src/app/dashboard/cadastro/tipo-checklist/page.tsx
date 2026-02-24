import { listTiposChecklist } from '@/lib/actions/tipoChecklist/list';
import type { PaginatedResult } from '@/lib/types/common';
import TipoChecklistPageClient from '@/ui/pages/dashboard/cadastro/TipoChecklistPageClient';
import { TipoChecklist } from '@nexa-oper/db';
import { redirect } from 'next/navigation';

export default async function TipoChecklistPage() {
  const result = await listTiposChecklist({
    page: 1,
    pageSize: 10,
    orderBy: 'id',
    orderDir: 'desc',
  });

  if (result.redirectToLogin) {
    redirect('/login');
  }

  const initialData: PaginatedResult<TipoChecklist> | undefined =
    result.success && result.data ? result.data : undefined;

  return <TipoChecklistPageClient initialData={initialData} />;
}
