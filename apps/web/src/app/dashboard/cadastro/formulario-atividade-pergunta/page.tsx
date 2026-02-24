import { listAtividadeFormPerguntas } from '@/lib/actions/atividadeFormPergunta/list';
import { listContratos } from '@/lib/actions/contrato/list';
import type { PaginatedResult } from '@/lib/types/common';
import AtividadeFormularioPerguntaPageClient from '@/ui/pages/dashboard/cadastro/AtividadeFormularioPerguntaPageClient';
import type { AtividadeFormPergunta, AtividadeFormTemplate, Contrato } from '@nexa-oper/db';
import { redirect } from 'next/navigation';

type AtividadeFormPerguntaRow = AtividadeFormPergunta & {
  atividadeFormTemplate?:
    | (Pick<AtividadeFormTemplate, 'id' | 'nome' | 'contratoId'> & {
        contrato?: Pick<Contrato, 'id' | 'nome' | 'numero'> | null;
      })
    | null;
};

export default async function AtividadeFormularioPerguntaPage() {
  const [perguntasResult, contratosResult] = await Promise.all([
    listAtividadeFormPerguntas({
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
      include: {
        atividadeFormTemplate: {
          include: {
            contrato: true,
          },
        },
      },
    }),
    listContratos({
      page: 1,
      pageSize: 1000,
      orderBy: 'nome',
      orderDir: 'asc',
    }),
  ]);

  if (perguntasResult.redirectToLogin || contratosResult.redirectToLogin) {
    redirect('/login');
  }

  const initialPerguntas: PaginatedResult<AtividadeFormPerguntaRow> | undefined =
    perguntasResult.success && perguntasResult.data
      ? (perguntasResult.data as PaginatedResult<AtividadeFormPerguntaRow>)
      : undefined;

  const initialContratos =
    contratosResult.success && contratosResult.data
      ? (contratosResult.data.data as Contrato[])
      : [];

  return (
    <AtividadeFormularioPerguntaPageClient
      initialPerguntas={initialPerguntas}
      initialContratos={initialContratos}
    />
  );
}
