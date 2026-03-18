import { listProjTiposEstrutura } from '@/lib/actions/projTipoEstrutura/list';
import type { PaginatedResult } from '@/lib/types/common';
import ProjTipoEstruturaPageClient from '@/ui/pages/dashboard/cadastro/projetos/ProjTipoEstruturaPageClient';
import type { ProjTipoEstrutura } from '@nexa-oper/db';
import { redirect } from 'next/navigation';

export default async function ProjTipoEstruturaPage() {
  const result = await listProjTiposEstrutura({
    page: 1,
    pageSize: 10,
    orderBy: 'id',
    orderDir: 'desc',
  });

  if (result.redirectToLogin) {
    redirect('/login');
  }

  const initialData: PaginatedResult<ProjTipoEstrutura> | undefined =
    result.success && result.data ? result.data : undefined;

  return <ProjTipoEstruturaPageClient initialData={initialData} />;
}
