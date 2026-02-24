import { listBases } from '@/lib/actions/base/list';
import { listCargos } from '@/lib/actions/cargo/list';
import { listContratos } from '@/lib/actions/contrato/list';
import { listEletricistas } from '@/lib/actions/eletricista/list';
import {
  type StatusEletricista,
} from '@/lib/schemas/eletricistaStatusSchema';
import type { PaginatedResult } from '@/lib/types/common';
import type { Base, Cargo, Contrato, Eletricista } from '@nexa-oper/db';
import { redirect } from 'next/navigation';
import EletricistaPageClient from '@/ui/pages/dashboard/cadastro/EletricistaPageClient';

type EletricistaWithBase = Eletricista & {
  baseAtual?: Base | null;
  Status?: { status: StatusEletricista } | null;
  cargo?: Cargo | null;
};

export default async function EletricistaPage() {
  const [eletricistasResult, contratosResult, cargosResult, basesResult] =
    await Promise.all([
      listEletricistas({
        page: 1,
        pageSize: 10,
        orderBy: 'id',
        orderDir: 'desc',
        include: {
          contrato: true,
          cargo: true,
          Status: true,
        },
      }),
      listContratos({
        page: 1,
        pageSize: 1000,
        orderBy: 'nome',
        orderDir: 'asc',
      }),
      listCargos({
        page: 1,
        pageSize: 1000,
        orderBy: 'nome',
        orderDir: 'asc',
      }),
      listBases({
        page: 1,
        pageSize: 1000,
        orderBy: 'nome',
        orderDir: 'asc',
      }),
    ]);

  if (
    eletricistasResult.redirectToLogin ||
    contratosResult.redirectToLogin ||
    cargosResult.redirectToLogin ||
    basesResult.redirectToLogin
  ) {
    redirect('/login');
  }

  const initialEletricistas =
    eletricistasResult.success && eletricistasResult.data
      ? (eletricistasResult.data as PaginatedResult<EletricistaWithBase>)
      : undefined;
  const initialContratos =
    contratosResult.success && contratosResult.data
      ? (contratosResult.data.data as Contrato[])
      : [];
  const initialCargos =
    cargosResult.success && cargosResult.data
      ? (cargosResult.data.data as Cargo[])
      : [];
  const initialBases =
    basesResult.success && basesResult.data
      ? (basesResult.data.data as Base[])
      : [];

  return (
    <EletricistaPageClient
      initialEletricistas={initialEletricistas}
      initialContratos={initialContratos}
      initialCargos={initialCargos}
      initialBases={initialBases}
    />
  );
}
