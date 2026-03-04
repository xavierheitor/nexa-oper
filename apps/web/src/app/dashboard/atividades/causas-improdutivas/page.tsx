import { listCausasImprodutivas } from '@/lib/actions/causaImprodutiva/list';
import type { PaginatedResult } from '@/lib/types/common';
import { getLastMonthDateRange } from '@/lib/utils/dateHelpers';
import CausasImprodutivasPageClient from '@/ui/pages/dashboard/atividades/CausasImprodutivasPageClient';
import { CausaImprodutiva } from '@nexa-oper/db';
import { redirect } from 'next/navigation';

export default async function CausasImprodutivasPage() {
  const { inicio, fim } = getLastMonthDateRange();

  const result = await listCausasImprodutivas({
    page: 1,
    pageSize: 10,
    orderBy: 'id',
    orderDir: 'desc',
    dataInicio: inicio,
    dataFim: fim,
  });

  if (result.redirectToLogin) {
    redirect('/login');
  }

  const initialData: PaginatedResult<CausaImprodutiva> | undefined =
    result.success && result.data ? result.data : undefined;

  return <CausasImprodutivasPageClient initialData={initialData} />;
}
