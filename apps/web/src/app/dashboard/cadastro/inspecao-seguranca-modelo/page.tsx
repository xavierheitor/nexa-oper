import { listInspecaoSegurancaModelos } from '@/lib/actions/inspecaoSegurancaModelo/list';
import type { PaginatedResult } from '@/lib/types/common';
import InspecaoSegurancaModeloPageClient from '@/ui/pages/dashboard/cadastro/InspecaoSegurancaModeloPageClient';
import type { InspecaoSegurancaModelo } from '@nexa-oper/db';
import { redirect } from 'next/navigation';

export default async function InspecaoSegurancaModeloPage() {
  const result = await listInspecaoSegurancaModelos({
    page: 1,
    pageSize: 10,
    orderBy: 'id',
    orderDir: 'desc',
  });

  if (result.redirectToLogin) redirect('/login');

  const initialData: PaginatedResult<InspecaoSegurancaModelo> | undefined =
    result.success && result.data ? result.data : undefined;

  return <InspecaoSegurancaModeloPageClient initialData={initialData} />;
}
