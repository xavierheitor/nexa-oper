import { listTiposAtividade } from '@/lib/actions/tipoAtividade/list';
import type { PaginatedResult } from '@/lib/types/common';
import TipoAtividadePageClient from '@/ui/pages/dashboard/cadastro/TipoAtividadePageClient';
import { TipoAtividade } from '@nexa-oper/db';
import { redirect } from 'next/navigation';

export default async function TipoAtividadePage() {
  const result = await listTiposAtividade({
    page: 1,
    pageSize: 10,
    orderBy: 'id',
    orderDir: 'desc',
  });

  if (result.redirectToLogin) {
    redirect('/login');
  }

  const initialData: PaginatedResult<TipoAtividade> | undefined =
    result.success && result.data ? result.data : undefined;

  return <TipoAtividadePageClient initialData={initialData} />;
}
