import { listBases } from '@/lib/actions/base/list';
import type { PaginatedResult } from '@/lib/types/common';
import BasePageClient from '@/ui/pages/dashboard/cadastro/BasePageClient';
import { Base } from '@nexa-oper/db';
import { redirect } from 'next/navigation';

export default async function BasePage() {
  const result = await listBases({
    page: 1,
    pageSize: 10,
    orderBy: 'id',
    orderDir: 'desc',
    include: { contrato: true },
  });

  if (result.redirectToLogin) {
    redirect('/login');
  }

  const initialData: PaginatedResult<Base> | undefined =
    result.success && result.data ? result.data : undefined;

  return <BasePageClient initialData={initialData} />;
}
