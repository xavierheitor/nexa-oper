import { listProjTiposRamal } from '@/lib/actions/projTipoRamal/list';
import type { PaginatedResult } from '@/lib/types/common';
import ProjTipoRamalPageClient from '@/ui/pages/dashboard/cadastro/projetos/ProjTipoRamalPageClient';
import type { ProjTipoRamal } from '@nexa-oper/db';
import { redirect } from 'next/navigation';

export default async function ProjTipoRamalPage() {
  const result = await listProjTiposRamal({
    page: 1,
    pageSize: 10,
    orderBy: 'id',
    orderDir: 'desc',
  });

  if (result.redirectToLogin) {
    redirect('/login');
  }

  const initialData: PaginatedResult<ProjTipoRamal> | undefined =
    result.success && result.data ? result.data : undefined;

  return <ProjTipoRamalPageClient initialData={initialData} />;
}
