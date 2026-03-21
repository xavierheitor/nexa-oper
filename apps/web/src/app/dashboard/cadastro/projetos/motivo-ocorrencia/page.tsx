import { listProjMotivosOcorrencia } from '@/lib/actions/projMotivoOcorrencia/list';
import type { PaginatedResult } from '@/lib/types/common';
import ProjMotivoOcorrenciaPageClient from '@/ui/pages/dashboard/cadastro/projetos/ProjMotivoOcorrenciaPageClient';
import type { ProjMotivoOcorrencia } from '@nexa-oper/db';
import { redirect } from 'next/navigation';

export default async function ProjMotivoOcorrenciaPage() {
  const result = await listProjMotivosOcorrencia({
    page: 1,
    pageSize: 10,
    orderBy: 'id',
    orderDir: 'desc',
  });

  if (result.redirectToLogin) {
    redirect('/login');
  }

  const initialData: PaginatedResult<ProjMotivoOcorrencia> | undefined =
    result.success && result.data ? result.data : undefined;

  return <ProjMotivoOcorrenciaPageClient initialData={initialData} />;
}
