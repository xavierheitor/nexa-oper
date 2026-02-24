import { listAtividadeFormTemplates } from '@/lib/actions/atividadeFormTemplate/list';
import { listAtividadeFormPerguntas } from '@/lib/actions/atividadeFormPergunta/list';
import { listContratos } from '@/lib/actions/contrato/list';
import { listTiposAtividadeServico } from '@/lib/actions/tipoAtividadeServico/list';
import type { PaginatedResult } from '@/lib/types/common';
import AtividadeFormularioPageClient from '@/ui/pages/dashboard/cadastro/AtividadeFormularioPageClient';
import type {
  AtividadeFormPergunta,
  AtividadeFormTemplate,
  AtividadeFormTipoServicoRelacao,
  Contrato,
  TipoAtividade,
  TipoAtividadeServico,
} from '@nexa-oper/db';
import { redirect } from 'next/navigation';

type TipoServicoRow = TipoAtividadeServico & {
  atividadeTipo?: Pick<TipoAtividade, 'id' | 'nome' | 'contratoId'> | null;
};

type AtividadeFormTemplateRow = AtividadeFormTemplate & {
  contrato?: Pick<Contrato, 'id' | 'nome' | 'numero'> | null;
  atividadeFormPerguntas?: Array<Pick<AtividadeFormPergunta, 'id' | 'perguntaChave'>>;
  atividadeFormTipoServicoRelacoes?: Array<
    AtividadeFormTipoServicoRelacao & {
      atividadeTipoServico?: TipoServicoRow | null;
    }
  >;
};

type PerguntaCatalogoRow = AtividadeFormPergunta & {
  atividadeFormTemplate?: Pick<AtividadeFormTemplate, 'id' | 'contratoId'> | null;
};

export default async function AtividadeFormularioPage() {
  const [templatesResult, contratosResult, tiposServicoResult, perguntasCatalogoResult] =
    await Promise.all([
      listAtividadeFormTemplates({
        page: 1,
        pageSize: 10,
        orderBy: 'id',
        orderDir: 'desc',
        include: {
          contrato: true,
          atividadeFormPerguntas: {
            where: { deletedAt: null },
            select: { id: true, perguntaChave: true },
          },
          atividadeFormTipoServicoRelacoes: {
            where: { deletedAt: null },
            include: {
              atividadeTipoServico: {
                include: { atividadeTipo: true },
              },
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
      listTiposAtividadeServico({
        page: 1,
        pageSize: 1000,
        orderBy: 'nome',
        orderDir: 'asc',
        include: {
          atividadeTipo: true,
        },
      }),
      listAtividadeFormPerguntas({
        page: 1,
        pageSize: 2000,
        orderBy: 'titulo',
        orderDir: 'asc',
        include: {
          atividadeFormTemplate: {
            select: {
              id: true,
              contratoId: true,
            },
          },
        },
      }),
    ]);

  if (
    templatesResult.redirectToLogin ||
    contratosResult.redirectToLogin ||
    tiposServicoResult.redirectToLogin ||
    perguntasCatalogoResult.redirectToLogin
  ) {
    redirect('/login');
  }

  const initialTemplates: PaginatedResult<AtividadeFormTemplateRow> | undefined =
    templatesResult.success && templatesResult.data
      ? (templatesResult.data as PaginatedResult<AtividadeFormTemplateRow>)
      : undefined;

  const initialContratos =
    contratosResult.success && contratosResult.data
      ? (contratosResult.data.data as Contrato[])
      : [];

  const initialTiposServico =
    tiposServicoResult.success && tiposServicoResult.data
      ? (tiposServicoResult.data.data as TipoServicoRow[])
      : [];

  const initialPerguntasCatalogo =
    perguntasCatalogoResult.success && perguntasCatalogoResult.data
      ? (perguntasCatalogoResult.data.data as PerguntaCatalogoRow[])
      : [];

  return (
    <AtividadeFormularioPageClient
      initialTemplates={initialTemplates}
      initialContratos={initialContratos}
      initialTiposServico={initialTiposServico}
      initialPerguntasCatalogo={initialPerguntasCatalogo}
    />
  );
}
