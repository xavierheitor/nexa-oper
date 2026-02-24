import { listAprs } from '@/lib/actions/apr/list';
import { listAprTipoAtividadeVinculos } from '@/lib/actions/aprVinculo/tipoAtividade/list';
import type { PaginatedResult } from '@/lib/types/common';
import AprModeloPageClient from '@/ui/pages/dashboard/cadastro/AprModeloPageClient';
import type { Apr, AprTipoAtividadeRelacao } from '@nexa-oper/db';
import { redirect } from 'next/navigation';

export default async function AprModeloPage() {
  const [aprsResult, taVinculosResult] = await Promise.all([
    listAprs({
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
      include: {
        AprGrupoRelacao: true,
      },
    }),
    listAprTipoAtividadeVinculos({
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
      include: {
        apr: true,
        tipoAtividade: true,
      },
    }),
  ]);

  if (aprsResult.redirectToLogin || taVinculosResult.redirectToLogin) {
    redirect('/login');
  }

  const aprsInitialData: PaginatedResult<Apr> | undefined =
    aprsResult.success && aprsResult.data ? aprsResult.data : undefined;

  const taVinculosInitialData: PaginatedResult<AprTipoAtividadeRelacao> | undefined =
    taVinculosResult.success && taVinculosResult.data
      ? taVinculosResult.data
      : undefined;

  return (
    <AprModeloPageClient
      aprsInitialData={aprsInitialData}
      taVinculosInitialData={taVinculosInitialData}
    />
  );
}
