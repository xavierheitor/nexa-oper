import { listProjTiposPoste } from '@/lib/actions/projTipoPoste/list';
import type { PaginatedResult } from '@/lib/types/common';
import ProjTipoPostePageClient from '@/ui/pages/dashboard/cadastro/projetos/ProjTipoPostePageClient';
import type { ProjTipoPoste } from '@nexa-oper/db';
import { redirect } from 'next/navigation';

export default async function ProjTipoPostePage() {
  const result = await listProjTiposPoste({
    page: 1,
    pageSize: 10,
    orderBy: 'id',
    orderDir: 'desc',
  });

  if (result.redirectToLogin) {
    redirect('/login');
  }

  const initialData: PaginatedResult<ProjTipoPoste> | undefined =
    result.success && result.data ? result.data : undefined;

  return <ProjTipoPostePageClient initialData={initialData} />;
}
