import { listInspecaoSegurancaTipos } from '@/lib/actions/inspecaoSegurancaTipo/list';
import type { PaginatedResult } from '@/lib/types/common';
import InspecaoSegurancaTipoPageClient from '@/ui/pages/dashboard/cadastro/InspecaoSegurancaTipoPageClient';
import type { InspecaoSegurancaTipo } from '@nexa-oper/db';
import { redirect } from 'next/navigation';

export default async function InspecaoSegurancaTipoPage() {
  const result = await listInspecaoSegurancaTipos({
    page: 1,
    pageSize: 10,
    orderBy: 'id',
    orderDir: 'desc',
  });

  if (result.redirectToLogin) redirect('/login');

  const initialData: PaginatedResult<InspecaoSegurancaTipo> | undefined =
    result.success && result.data ? result.data : undefined;

  return <InspecaoSegurancaTipoPageClient initialData={initialData} />;
}
