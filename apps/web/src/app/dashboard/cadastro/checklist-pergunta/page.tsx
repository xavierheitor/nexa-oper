import { listChecklistPerguntas } from '@/lib/actions/checklistPergunta/list';
import type { PaginatedResult } from '@/lib/types/common';
import ChecklistPerguntaPageClient from '@/ui/pages/dashboard/cadastro/ChecklistPerguntaPageClient';
import { ChecklistPergunta } from '@nexa-oper/db';
import { redirect } from 'next/navigation';

export default async function ChecklistPerguntaPage() {
  const result = await listChecklistPerguntas({
    page: 1,
    pageSize: 10,
    orderBy: 'id',
    orderDir: 'desc',
  });

  if (result.redirectToLogin) {
    redirect('/login');
  }

  const initialData: PaginatedResult<ChecklistPergunta> | undefined =
    result.success && result.data ? result.data : undefined;

  return <ChecklistPerguntaPageClient initialData={initialData} />;
}
