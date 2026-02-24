import { listTiposAtividadeServico } from '@/lib/actions/tipoAtividadeServico/list';
import { listTiposAtividade } from '@/lib/actions/tipoAtividade/list';
import type { PaginatedResult } from '@/lib/types/common';
import SubtipoAtividadePageClient from '@/ui/pages/dashboard/cadastro/SubtipoAtividadePageClient';
import type { TipoAtividade, TipoAtividadeServico } from '@nexa-oper/db';
import { redirect } from 'next/navigation';

type TipoAtividadeServicoRow = TipoAtividadeServico & {
  atividadeTipo?: Pick<TipoAtividade, 'id' | 'nome'>;
};

export default async function SubtipoAtividadePage() {
  const [result, tiposAtividadeResult] = await Promise.all([
    listTiposAtividadeServico({
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
      include: { atividadeTipo: true },
    }),
    listTiposAtividade({
      page: 1,
      pageSize: 1000,
      orderBy: 'nome',
      orderDir: 'asc',
    }),
  ]);

  if (result.redirectToLogin || tiposAtividadeResult.redirectToLogin) {
    redirect('/login');
  }

  const initialData: PaginatedResult<TipoAtividadeServicoRow> | undefined =
    result.success && result.data ? result.data : undefined;

  const initialTiposAtividade =
    tiposAtividadeResult.success && tiposAtividadeResult.data
      ? (tiposAtividadeResult.data.data as Pick<TipoAtividade, 'id' | 'nome'>[])
      : [];

  return (
    <SubtipoAtividadePageClient
      initialData={initialData}
      initialTiposAtividade={initialTiposAtividade}
    />
  );
}
