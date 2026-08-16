import { listInspecaoSegurancaGruposPergunta } from '@/lib/actions/inspecaoSegurancaGrupoPergunta/list';
import type { PaginatedResult } from '@/lib/types/common';
import InspecaoSegurancaGrupoPerguntaPageClient from '@/ui/pages/dashboard/cadastro/InspecaoSegurancaGrupoPerguntaPageClient';
import type { InspecaoSegurancaGrupoPergunta } from '@nexa-oper/db';
import { redirect } from 'next/navigation';

export default async function InspecaoSegurancaGrupoPerguntaPage() {
  const result = await listInspecaoSegurancaGruposPergunta({
    page: 1,
    pageSize: 10,
    orderBy: 'id',
    orderDir: 'desc',
  });

  if (result.redirectToLogin) redirect('/login');

  const initialData: PaginatedResult<InspecaoSegurancaGrupoPergunta> | undefined =
    result.success && result.data ? result.data : undefined;

  return <InspecaoSegurancaGrupoPerguntaPageClient initialData={initialData} />;
}
