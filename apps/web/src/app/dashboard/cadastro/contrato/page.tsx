import { listContratos } from '@/lib/actions/contrato/list';
import type { PaginatedResult } from '@/lib/types/common';
import ContratoPageClient from '@/ui/pages/dashboard/cadastro/ContratoPageClient';
import { Contrato } from '@nexa-oper/db';
import { redirect } from 'next/navigation';

export default async function ContratoPage() {
  const result = await listContratos({
    page: 1,
    pageSize: 10,
    orderBy: 'id',
    orderDir: 'desc',
  });

  if (result.redirectToLogin) {
    redirect('/login');
  }

  const initialData: PaginatedResult<Contrato> | undefined =
    result.success && result.data ? result.data : undefined;

  return <ContratoPageClient initialData={initialData} />;
}
