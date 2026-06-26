import { redirect } from 'next/navigation';
import { listContratosLookup } from '@/lib/actions/contrato/listLookup';
import { listProjProgramas } from '@/lib/actions/projPrograma/list';
import type { ProjProgramaListItem } from '@/lib/repositories/projetos/ProjProgramaRepository';
import type { PaginatedResult } from '@/lib/types/common';
import ProjProgramaPageClient from '@/ui/pages/dashboard/cadastro/projetos/ProjProgramaPageClient';
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

export default async function ProjProgramaPage() {
  const [programasResult, contratosResult] = await Promise.all([
    listProjProgramas({
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
    }),
    listContratosLookup({
      page: 1,
      pageSize: 1000,
      orderBy: 'nome',
      orderDir: 'asc',
    }),
  ]);

  if (programasResult.redirectToLogin || contratosResult.redirectToLogin) {
    redirect('/login');
  }

  const initialData: PaginatedResult<ProjProgramaListItem> | undefined =
    programasResult.success && programasResult.data
      ? programasResult.data
      : undefined;

  const contratos = mapContratos(
    contratosResult.success ? contratosResult.data?.data : []
  );

  return (
    <ProjProgramaPageClient
      initialContratos={contratos}
      initialData={initialData}
    />
  );
}
