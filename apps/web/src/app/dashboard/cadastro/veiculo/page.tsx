import { listBases } from '@/lib/actions/base/list';
import { listContratos } from '@/lib/actions/contrato/list';
import { listTiposVeiculo } from '@/lib/actions/tipoVeiculo/list';
import { listVeiculos } from '@/lib/actions/veiculo/list';
import type { PaginatedResult } from '@/lib/types/common';
import type { Base, Veiculo } from '@nexa-oper/db';
import { redirect } from 'next/navigation';
import VeiculoPageClient from '@/ui/pages/dashboard/cadastro/VeiculoPageClient';

type VeiculoWithBase = Veiculo & { baseAtual?: Base | null };

export default async function VeiculoPage() {
  const [veiculosResult, contratosResult, basesResult, tiposVeiculoResult] =
    await Promise.all([
      listVeiculos({
        page: 1,
        pageSize: 10,
        orderBy: 'id',
        orderDir: 'desc',
        include: {
          tipoVeiculo: true,
          contrato: true,
        },
      }),
      listContratos({
        page: 1,
        pageSize: 100,
        orderBy: 'nome',
        orderDir: 'asc',
      }),
      listBases({
        page: 1,
        pageSize: 100,
        orderBy: 'nome',
        orderDir: 'asc',
      }),
      listTiposVeiculo({
        page: 1,
        pageSize: 100,
        orderBy: 'nome',
        orderDir: 'asc',
      }),
    ]);

  if (
    veiculosResult.redirectToLogin ||
    contratosResult.redirectToLogin ||
    basesResult.redirectToLogin ||
    tiposVeiculoResult.redirectToLogin
  ) {
    redirect('/login');
  }

  const initialVeiculos =
    veiculosResult.success && veiculosResult.data
      ? (veiculosResult.data as PaginatedResult<VeiculoWithBase>)
      : undefined;
  const initialContratos =
    contratosResult.success && contratosResult.data
      ? (contratosResult.data.data as Array<{ id: number; nome: string }>)
      : [];
  const initialBases =
    basesResult.success && basesResult.data ? (basesResult.data.data as Base[]) : [];
  const initialTiposVeiculo =
    tiposVeiculoResult.success && tiposVeiculoResult.data
      ? (tiposVeiculoResult.data.data as Array<{ id: number; nome: string }>)
      : [];

  return (
    <VeiculoPageClient
      initialVeiculos={initialVeiculos}
      initialContratos={initialContratos}
      initialBases={initialBases}
      initialTiposVeiculo={initialTiposVeiculo}
    />
  );
}
