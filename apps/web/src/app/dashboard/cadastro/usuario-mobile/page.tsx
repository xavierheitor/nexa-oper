import { listMobileUsers } from '@/lib/actions/mobileUser/list';
import type { PaginatedResult } from '@/lib/types/common';
import UsuarioMobilePageClient from '@/ui/pages/dashboard/cadastro/UsuarioMobilePageClient';
import type { MobileUser } from '@nexa-oper/db';
import { redirect } from 'next/navigation';

export default async function UsuarioMobilePage() {
  const result = await listMobileUsers({
    page: 1,
    pageSize: 10,
    orderBy: 'username',
    orderDir: 'asc',
  });

  if (result.redirectToLogin) {
    redirect('/login');
  }

  const initialData: PaginatedResult<MobileUser> | undefined =
    result.success && result.data ? result.data : undefined;

  return <UsuarioMobilePageClient initialData={initialData} />;
}
