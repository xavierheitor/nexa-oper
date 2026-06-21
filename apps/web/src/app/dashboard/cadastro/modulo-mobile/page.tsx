import { listMobileModules } from '@/lib/actions/mobileModule/list';
import type { PaginatedResult } from '@/lib/types/common';
import MobileModulePageClient from '@/ui/pages/dashboard/cadastro/MobileModulePageClient';
import type { MobileModule } from '@nexa-oper/db';
import { redirect } from 'next/navigation';

export default async function MobileModulePage() {
  const result = await listMobileModules({
    page: 1,
    pageSize: 10,
    orderBy: 'ordem',
    orderDir: 'asc',
  });
  if (result.redirectToLogin) redirect('/login');
  const initialData: PaginatedResult<MobileModule> | undefined =
    result.success && result.data ? result.data : undefined;
  return <MobileModulePageClient initialData={initialData} />;
}
