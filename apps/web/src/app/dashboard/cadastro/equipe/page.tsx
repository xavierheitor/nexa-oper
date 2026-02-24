import { listBases } from '@/lib/actions/base/list';
import { listContratos } from '@/lib/actions/contrato/list';
import { listEquipes } from '@/lib/actions/equipe/list';
import { listTiposEquipe } from '@/lib/actions/tipoEquipe/list';
import type { PaginatedResult } from '@/lib/types/common';
import type { Base, Contrato, Equipe, TipoEquipe } from '@nexa-oper/db';
import EquipePageClient from '@/ui/pages/dashboard/cadastro/EquipePageClient';
import { redirect } from 'next/navigation';

type EquipeWithBase = Equipe & { baseAtual?: Base | null };

export default async function EquipePage() {
  const [equipesResult, basesResult, contratosResult, tiposEquipeResult] =
    await Promise.all([
      listEquipes({
        page: 1,
        pageSize: 10,
        orderBy: 'id',
        orderDir: 'desc',
        include: {
          tipoEquipe: true,
          contrato: true,
        },
      }),
      listBases({
        page: 1,
        pageSize: 1000,
        orderBy: 'nome',
        orderDir: 'asc',
      }),
      listContratos({
        page: 1,
        pageSize: 100,
        orderBy: 'nome',
        orderDir: 'asc',
      }),
      listTiposEquipe({
        page: 1,
        pageSize: 100,
        orderBy: 'nome',
        orderDir: 'asc',
      }),
    ]);

  if (
    equipesResult.redirectToLogin ||
    basesResult.redirectToLogin ||
    contratosResult.redirectToLogin ||
    tiposEquipeResult.redirectToLogin
  ) {
    redirect('/login');
  }

  const initialEquipes =
    equipesResult.success && equipesResult.data
      ? (equipesResult.data as PaginatedResult<EquipeWithBase>)
      : undefined;
  const initialBases =
    basesResult.success && basesResult.data ? (basesResult.data.data as Base[]) : [];
  const initialContratos =
    contratosResult.success && contratosResult.data
      ? (contratosResult.data.data as Contrato[])
      : [];
  const initialTiposEquipe =
    tiposEquipeResult.success && tiposEquipeResult.data
      ? (tiposEquipeResult.data.data as TipoEquipe[])
      : [];

  return (
    <EquipePageClient
      initialEquipes={initialEquipes}
      initialBases={initialBases}
      initialContratos={initialContratos}
      initialTiposEquipe={initialTiposEquipe}
    />
  );
}
