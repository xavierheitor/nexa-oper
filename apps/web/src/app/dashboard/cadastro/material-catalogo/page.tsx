import { listContratos } from '@/lib/actions/contrato/list';
import { listMateriaisCatalogo } from '@/lib/actions/materialCatalogo/list';
import type { PaginatedResult } from '@/lib/types/common';
import MaterialCatalogoPageClient from '@/ui/pages/dashboard/cadastro/MaterialCatalogoPageClient';
import type { Contrato, MaterialCatalogo } from '@nexa-oper/db';
import { redirect } from 'next/navigation';

type MaterialCatalogoWithContrato = MaterialCatalogo & {
  contrato?: Pick<Contrato, 'id' | 'nome' | 'numero'> | null;
};

export default async function MaterialCatalogoPage() {
  const [materiaisResult, contratosResult] = await Promise.all([
    listMateriaisCatalogo({
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
      include: { contrato: true },
    }),
    listContratos({
      page: 1,
      pageSize: 1000,
      orderBy: 'nome',
      orderDir: 'asc',
    }),
  ]);

  if (materiaisResult.redirectToLogin || contratosResult.redirectToLogin) {
    redirect('/login');
  }

  const initialMateriais =
    materiaisResult.success && materiaisResult.data
      ? (materiaisResult.data as PaginatedResult<MaterialCatalogoWithContrato>)
      : undefined;
  const initialContratos =
    contratosResult.success && contratosResult.data
      ? (contratosResult.data.data as Contrato[])
      : [];

  return (
    <MaterialCatalogoPageClient
      initialMateriais={initialMateriais}
      initialContratos={initialContratos}
    />
  );
}
