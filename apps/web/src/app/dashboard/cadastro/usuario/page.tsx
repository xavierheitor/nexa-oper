import { listUsers } from '@/lib/actions/user/list';
import type { PaginatedResult } from '@/lib/types/common';
import UsuarioPageClient from '@/ui/pages/dashboard/cadastro/UsuarioPageClient';
import { User } from '@nexa-oper/db';
import { redirect } from 'next/navigation';

export default async function UsuarioPage() {
  const result = await listUsers({
    page: 1,
    pageSize: 10,
    orderBy: 'nome',
    orderDir: 'asc',
  });

  if (result.redirectToLogin) {
    redirect('/login');
  }

  const initialData: PaginatedResult<User> | undefined =
    result.success && result.data ? result.data : undefined;

  return <UsuarioPageClient initialData={initialData} />;
}
