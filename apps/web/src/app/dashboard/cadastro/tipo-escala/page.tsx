import { listTiposEscala } from '@/lib/actions/escala/tipoEscala';
import type { PaginatedResult } from '@/lib/types/common';
import TipoEscalaPageClient, {
  TipoEscala,
} from '@/ui/pages/dashboard/cadastro/TipoEscalaPageClient';
import { redirect } from 'next/navigation';

export default async function TipoEscalaPage() {
  const result = await listTiposEscala({
    page: 1,
    pageSize: 10,
    orderBy: 'nome',
    orderDir: 'asc',
  });

  if (result.redirectToLogin) {
    redirect('/login');
  }

  const initialData: PaginatedResult<TipoEscala> | undefined =
    result.success && result.data ? result.data : undefined;

  return <TipoEscalaPageClient initialData={initialData} />;
}
