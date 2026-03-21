import type { Contrato } from '@nexa-oper/db';
import { redirect } from 'next/navigation';
import { listContratosLookup } from '@/lib/actions/contrato/listLookup';
import { listMateriaisCatalogoLookup } from '@/lib/actions/materialCatalogo/listLookup';
import { listProjTiposEstrutura } from '@/lib/actions/projTipoEstrutura/list';
import { listProjTiposEstruturaMaterial } from '@/lib/actions/projTipoEstruturaMaterial/list';
import type { PaginatedResult } from '@/lib/types/common';
import type {
  ProjTipoEstruturaMaterialPageClientProps,
  ProjTipoEstruturaMaterialTableRow,
} from '@/ui/pages/dashboard/cadastro/projetos/ProjTipoEstruturaMaterialPageClient';
import ProjTipoEstruturaPageClient, {
  type ProjTipoEstruturaTableRow,
} from '@/ui/pages/dashboard/cadastro/projetos/ProjTipoEstruturaPageClient';

type ContratoOption = Pick<Contrato, 'id' | 'nome' | 'numero'>;

export default async function ProjTipoEstruturaPage() {
  const [
    result,
    contratosResult,
    materialResult,
    tiposEstruturaLookupResult,
    materiaisResult,
  ] = await Promise.all([
    listProjTiposEstrutura({
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
      include: {
        contrato: true,
      },
    }),
    listContratosLookup({
      page: 1,
      pageSize: 1000,
      orderBy: 'nome',
      orderDir: 'asc',
    }),
    listProjTiposEstruturaMaterial({
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
    }),
    listProjTiposEstrutura({
      page: 1,
      pageSize: 1000,
      orderBy: 'nome',
      orderDir: 'asc',
    }),
    listMateriaisCatalogoLookup({
      page: 1,
      pageSize: 1000,
      orderBy: 'descricao',
      orderDir: 'asc',
    }),
  ]);

  if (
    result.redirectToLogin ||
    contratosResult.redirectToLogin ||
    materialResult.redirectToLogin ||
    tiposEstruturaLookupResult.redirectToLogin ||
    materiaisResult.redirectToLogin
  ) {
    redirect('/login');
  }

  const initialData =
    result.success && result.data
      ? (result.data as PaginatedResult<ProjTipoEstruturaTableRow>)
      : undefined;
  const initialContratos =
    contratosResult.success && contratosResult.data
      ? (contratosResult.data.data as ContratoOption[])
      : [];
  const initialMaterialData =
    materialResult.success && materialResult.data
      ? (materialResult.data as PaginatedResult<ProjTipoEstruturaMaterialTableRow>)
      : undefined;
  const initialTiposEstruturaLookup =
    tiposEstruturaLookupResult.success && tiposEstruturaLookupResult.data
      ? (tiposEstruturaLookupResult.data.data as NonNullable<
          ProjTipoEstruturaMaterialPageClientProps['initialTiposEstrutura']
        >)
      : [];
  const initialMateriais =
    materiaisResult.success && materiaisResult.data
      ? (materiaisResult.data.data as NonNullable<
          ProjTipoEstruturaMaterialPageClientProps['initialMateriais']
        >)
      : [];

  return (
    <ProjTipoEstruturaPageClient
      initialData={initialData}
      initialContratos={initialContratos}
      initialMaterialData={initialMaterialData}
      initialTiposEstruturaLookup={initialTiposEstruturaLookup}
      initialMateriais={initialMateriais}
    />
  );
}
