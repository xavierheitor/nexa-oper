import { listTiposJustificativa } from '@/lib/actions/tipo-justificativa/list';
import type { PaginatedResult } from '@/lib/types/common';
import TipoJustificativaPageClient from '@/ui/pages/dashboard/cadastro/TipoJustificativaPageClient';
import { TipoJustificativa } from '@nexa-oper/db';
import { redirect } from 'next/navigation';

export default async function TipoJustificativaPage() {
  const result = await listTiposJustificativa({
    page: 1,
    pageSize: 10,
    orderBy: 'nome',
    orderDir: 'asc',
  });

  if (result.redirectToLogin) {
    redirect('/login');
  }

  const initialData: PaginatedResult<TipoJustificativa> | undefined =
    result.success && result.data ? result.data : undefined;

  return <TipoJustificativaPageClient initialData={initialData} />;
}
