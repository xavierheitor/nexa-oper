import { listTiposAtividadeServico } from '@/lib/actions/tipoAtividadeServico/list';
import type { PaginatedResult } from '@/lib/types/common';
import SubtipoAtividadePageClient from '@/ui/pages/dashboard/cadastro/SubtipoAtividadePageClient';
import type { TipoAtividade, TipoAtividadeServico } from '@nexa-oper/db';
import { redirect } from 'next/navigation';

type TipoAtividadeServicoRow = TipoAtividadeServico & {
  atividadeTipo?: Pick<TipoAtividade, 'id' | 'nome'>;
};

export default async function SubtipoAtividadePage() {
  const result = await listTiposAtividadeServico({
    page: 1,
    pageSize: 10,
    orderBy: 'id',
    orderDir: 'desc',
    include: { atividadeTipo: true },
  });

  if (result.redirectToLogin) {
    redirect('/login');
  }

  const initialData: PaginatedResult<TipoAtividadeServicoRow> | undefined =
    result.success && result.data ? result.data : undefined;

  return <SubtipoAtividadePageClient initialData={initialData} />;
}
