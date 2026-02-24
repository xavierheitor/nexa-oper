import { listAprGruposPergunta } from '@/lib/actions/aprGrupoPergunta/list';
import type { PaginatedResult } from '@/lib/types/common';
import AprGrupoPerguntaPageClient from '@/ui/pages/dashboard/cadastro/AprGrupoPerguntaPageClient';
import { AprGrupoPergunta } from '@nexa-oper/db';
import { redirect } from 'next/navigation';

export default async function AprGrupoPerguntaPage() {
  const result = await listAprGruposPergunta({
    page: 1,
    pageSize: 10,
    orderBy: 'id',
    orderDir: 'desc',
    include: {
      AprGrupoPerguntaRelacao: true,
      AprGrupoOpcaoRespostaRelacao: true,
    },
  });

  if (result.redirectToLogin) {
    redirect('/login');
  }

  const initialData: PaginatedResult<AprGrupoPergunta> | undefined =
    result.success && result.data ? result.data : undefined;

  return <AprGrupoPerguntaPageClient initialData={initialData} />;
}
