import { listAprMedidasControle } from '@/lib/actions/aprMedidaControle/list';
import type { PaginatedResult } from '@/lib/types/common';
import AprMedidaControlePageClient from '@/ui/pages/dashboard/cadastro/AprMedidaControlePageClient';
import { AprMedidaControle } from '@nexa-oper/db';
import { redirect } from 'next/navigation';

export default async function AprMedidaControlePage() {
  const result = await listAprMedidasControle({
    page: 1,
    pageSize: 10,
    orderBy: 'id',
    orderDir: 'desc',
  });

  if (result.redirectToLogin) {
    redirect('/login');
  }

  const initialData: PaginatedResult<AprMedidaControle> | undefined =
    result.success && result.data ? result.data : undefined;

  return <AprMedidaControlePageClient initialData={initialData} />;
}
