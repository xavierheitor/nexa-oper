import { listChecklists } from '@/lib/actions/checklist/list';
import { listChecklistTipoEquipeVinculos } from '@/lib/actions/checklistVinculo/tipoEquipe/list';
import { listChecklistTipoVeiculoVinculos } from '@/lib/actions/checklistVinculo/tipoVeiculo/list';
import type { PaginatedResult } from '@/lib/types/common';
import ChecklistModeloPageClient from '@/ui/pages/dashboard/cadastro/ChecklistModeloPageClient';
import type {
  Checklist,
  ChecklistTipoEquipeRelacao,
  ChecklistTipoVeiculoRelacao,
} from '@nexa-oper/db';
import { redirect } from 'next/navigation';

export default async function ChecklistModeloPage() {
  const [checklistsResult, tvVinculosResult, teVinculosResult] = await Promise.all([
    listChecklists({
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
      include: {
        tipoChecklist: true,
        ChecklistPerguntaRelacao: true,
        ChecklistOpcaoRespostaRelacao: true,
      },
    }),
    listChecklistTipoVeiculoVinculos({
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
      include: { tipoVeiculo: true, checklist: true },
    }),
    listChecklistTipoEquipeVinculos({
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
      include: { tipoEquipe: true, checklist: true },
    }),
  ]);

  if (
    checklistsResult.redirectToLogin ||
    tvVinculosResult.redirectToLogin ||
    teVinculosResult.redirectToLogin
  ) {
    redirect('/login');
  }

  const checklistsInitialData: PaginatedResult<Checklist> | undefined =
    checklistsResult.success && checklistsResult.data
      ? checklistsResult.data
      : undefined;

  const tvVinculosInitialData: PaginatedResult<ChecklistTipoVeiculoRelacao> | undefined =
    tvVinculosResult.success && tvVinculosResult.data
      ? tvVinculosResult.data
      : undefined;

  const teVinculosInitialData: PaginatedResult<ChecklistTipoEquipeRelacao> | undefined =
    teVinculosResult.success && teVinculosResult.data
      ? teVinculosResult.data
      : undefined;

  return (
    <ChecklistModeloPageClient
      checklistsInitialData={checklistsInitialData}
      tvVinculosInitialData={tvVinculosInitialData}
      teVinculosInitialData={teVinculosInitialData}
    />
  );
}
