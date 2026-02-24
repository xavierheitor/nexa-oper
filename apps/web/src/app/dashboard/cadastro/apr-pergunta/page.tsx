import { listAprPerguntas } from '@/lib/actions/aprPergunta/list';
import type { PaginatedResult } from '@/lib/types/common';
import AprPerguntaPageClient from '@/ui/pages/dashboard/cadastro/AprPerguntaPageClient';
import { AprPergunta } from '@nexa-oper/db';
import { redirect } from 'next/navigation';

export default async function AprPerguntaPage() {
  const result = await listAprPerguntas({
    page: 1,
    pageSize: 10,
    orderBy: 'id',
    orderDir: 'desc',
  });

  if (result.redirectToLogin) {
    redirect('/login');
  }

  const initialData: PaginatedResult<AprPergunta> | undefined =
    result.success && result.data ? result.data : undefined;

  return <AprPerguntaPageClient initialData={initialData} />;
}
