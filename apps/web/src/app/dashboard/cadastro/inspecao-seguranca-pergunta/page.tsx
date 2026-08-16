import { listInspecaoSegurancaPerguntas } from '@/lib/actions/inspecaoSegurancaPergunta/list';
import type { PaginatedResult } from '@/lib/types/common';
import InspecaoSegurancaPerguntaPageClient from '@/ui/pages/dashboard/cadastro/InspecaoSegurancaPerguntaPageClient';
import type { InspecaoSegurancaPergunta } from '@nexa-oper/db';
import { redirect } from 'next/navigation';

export default async function InspecaoSegurancaPerguntaPage() {
  const result = await listInspecaoSegurancaPerguntas({
    page: 1,
    pageSize: 10,
    orderBy: 'id',
    orderDir: 'desc',
  });

  if (result.redirectToLogin) redirect('/login');

  const initialData: PaginatedResult<InspecaoSegurancaPergunta> | undefined =
    result.success && result.data ? result.data : undefined;

  return <InspecaoSegurancaPerguntaPageClient initialData={initialData} />;
}
