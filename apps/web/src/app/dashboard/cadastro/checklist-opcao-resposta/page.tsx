import { listChecklistOpcoesResposta } from '@/lib/actions/checklistOpcaoResposta/list';
import type { PaginatedResult } from '@/lib/types/common';
import ChecklistOpcaoRespostaPageClient from '@/ui/pages/dashboard/cadastro/ChecklistOpcaoRespostaPageClient';
import { ChecklistOpcaoResposta } from '@nexa-oper/db';
import { redirect } from 'next/navigation';

export default async function ChecklistOpcaoRespostaPage() {
  const result = await listChecklistOpcoesResposta({
    page: 1,
    pageSize: 10,
    orderBy: 'id',
    orderDir: 'desc',
  });

  if (result.redirectToLogin) {
    redirect('/login');
  }

  const initialData: PaginatedResult<ChecklistOpcaoResposta> | undefined =
    result.success && result.data ? result.data : undefined;

  return <ChecklistOpcaoRespostaPageClient initialData={initialData} />;
}
