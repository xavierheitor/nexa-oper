import { Contrato, ProjetoProgramacao } from '@nexa-oper/db';
import { redirect } from 'next/navigation';
import { listContratosLookup } from '@/lib/actions/contrato/listLookup';
import { listProjetoProgramacoes } from '@/lib/actions/projetoProgramacao/list';
import type { PaginatedResult } from '@/lib/types/common';
import ProjetoProgramacaoPageClient from '@/ui/pages/dashboard/projetos/ProjetoProgramacaoPageClient';

type ProjetoProgramacaoListItem = ProjetoProgramacao & {
  contrato: Contrato;
};

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
  const [projetosResult, contratosResult] = await Promise.all([
    listProjetoProgramacoes({
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

  if (projetosResult.redirectToLogin || contratosResult.redirectToLogin) {
    redirect('/login');
  }

  const initialData: PaginatedResult<ProjetoProgramacaoListItem> | undefined =
    projetosResult.success && projetosResult.data
      ? projetosResult.data
      : undefined;

  const contratos = mapContratos(
    contratosResult.success ? contratosResult.data?.data : []
  );

  return (
    <ProjetoProgramacaoPageClient
      contratos={contratos}
      initialData={initialData}
    />
  );
}
