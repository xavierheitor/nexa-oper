import { listCausasImprodutivas } from '@/lib/actions/causaImprodutiva/list';
import type { PaginatedResult } from '@/lib/types/common';
import CausasImprodutivasPageClient from '@/ui/pages/dashboard/atividades/CausasImprodutivasPageClient';
import { CausaImprodutiva } from '@nexa-oper/db';
import { redirect } from 'next/navigation';

export default async function CausasImprodutivasPage() {
  const result = await listCausasImprodutivas({
    page: 1,
    pageSize: 10,
    orderBy: 'id',
    orderDir: 'desc',
  });

  if (result.redirectToLogin) {
    redirect('/login');
  }

  const initialData: PaginatedResult<CausaImprodutiva> | undefined =
    result.success && result.data ? result.data : undefined;

  return <CausasImprodutivasPageClient initialData={initialData} />;
}
