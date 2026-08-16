import { listInspecaoSegurancaOpcoesResposta } from '@/lib/actions/inspecaoSegurancaOpcaoResposta/list';
import type { PaginatedResult } from '@/lib/types/common';
import InspecaoSegurancaOpcaoRespostaPageClient from '@/ui/pages/dashboard/cadastro/InspecaoSegurancaOpcaoRespostaPageClient';
import type { InspecaoSegurancaOpcaoResposta } from '@nexa-oper/db';
import { redirect } from 'next/navigation';

export default async function InspecaoSegurancaOpcaoRespostaPage() {
  const result = await listInspecaoSegurancaOpcoesResposta({
    page: 1,
    pageSize: 10,
    orderBy: 'id',
    orderDir: 'desc',
  });

  if (result.redirectToLogin) redirect('/login');

  const initialData: PaginatedResult<InspecaoSegurancaOpcaoResposta> | undefined =
    result.success && result.data ? result.data : undefined;

  return <InspecaoSegurancaOpcaoRespostaPageClient initialData={initialData} />;
}
