import { redirect } from 'next/navigation';
import { listContratosLookup } from '@/lib/actions/contrato/listLookup';
import { listProjProgramas } from '@/lib/actions/projPrograma/list';
import { listProjProjetos } from '@/lib/actions/projProjeto/list';
import type { ProjProgramaListItem } from '@/lib/repositories/projetos/ProjProgramaRepository';
import type { ProjProjetoListItem } from '@/lib/repositories/projetos/ProjProjetoRepository';
import type { PaginatedResult } from '@/lib/types/common';
import ProjetoCadastroPageClient from '@/ui/pages/dashboard/projetos/ProjetoCadastroPageClient';
import type { Contrato } from '@nexa-oper/db';

interface ContratoOption {
  id: number;
  nome: string;
  numero: string;
}

function mapContratos(input: unknown): ContratoOption[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item) => {
      const contrato = item as Partial<Contrato>;
      if (
        typeof contrato.id !== 'number' ||
        typeof contrato.nome !== 'string' ||
        typeof contrato.numero !== 'string'
      ) {
        return null;
      }

      return {
        id: contrato.id,
        nome: contrato.nome,
        numero: contrato.numero,
      };
    })
    .filter((item): item is ContratoOption => item !== null);
}

export default async function ProjetoCadastroPage() {
  const [projetosResult, programasLookupResult, contratosResult] =
    await Promise.all([
    listProjProjetos({
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
    }),
    listProjProgramas({
      page: 1,
      pageSize: 1000,
      orderBy: 'nome',
      orderDir: 'asc',
    }),
    listContratosLookup({
      page: 1,
      pageSize: 1000,
      orderBy: 'nome',
      orderDir: 'asc',
    }),
  ]);

  if (
    projetosResult.redirectToLogin ||
    programasLookupResult.redirectToLogin ||
    contratosResult.redirectToLogin
  ) {
    redirect('/login');
  }

  const initialProjetos: PaginatedResult<ProjProjetoListItem> | undefined =
    projetosResult.success && projetosResult.data
      ? projetosResult.data
      : undefined;
  const initialProgramasLookup =
    programasLookupResult.success && programasLookupResult.data
      ? (programasLookupResult.data.data as ProjProgramaListItem[])
      : [];

  const contratos = mapContratos(
    contratosResult.success ? contratosResult.data?.data : []
  );

  return (
    <ProjetoCadastroPageClient
      initialContratos={contratos}
      initialProgramasLookup={initialProgramasLookup}
      initialProjetos={initialProjetos}
    />
  );
}
