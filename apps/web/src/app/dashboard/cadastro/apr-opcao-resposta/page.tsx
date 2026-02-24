import { listAprOpcoesResposta } from '@/lib/actions/aprOpcaoResposta/list';
import type { PaginatedResult } from '@/lib/types/common';
import AprOpcaoRespostaPageClient from '@/ui/pages/dashboard/cadastro/AprOpcaoRespostaPageClient';
import { AprOpcaoResposta } from '@nexa-oper/db';
import { redirect } from 'next/navigation';

export default async function AprOpcaoRespostaPage() {
  const result = await listAprOpcoesResposta({
    page: 1,
    pageSize: 10,
    orderBy: 'id',
    orderDir: 'desc',
  });

  if (result.redirectToLogin) {
    redirect('/login');
  }

  const initialData: PaginatedResult<AprOpcaoResposta> | undefined =
    result.success && result.data ? result.data : undefined;

  return <AprOpcaoRespostaPageClient initialData={initialData} />;
}
