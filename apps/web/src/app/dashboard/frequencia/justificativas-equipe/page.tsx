import { listJustificativasEquipe } from '@/lib/actions/justificativa-equipe/list';
import { listCasosJustificativaEquipe } from '@/lib/actions/justificativa-equipe/listCasosPendentes';
import JustificativasEquipePageClient from '@/ui/pages/dashboard/frequencia/JustificativasEquipePageClient';
import type {
  JustificativaEquipeListResponse,
  CasoJustificativaEquipeListResponse,
} from '@/ui/pages/dashboard/frequencia/JustificativasEquipePageClient';
import { redirect } from 'next/navigation';

function normalizeJustificativasResponse(
  input: unknown
): JustificativaEquipeListResponse {
  const raw = (input ?? {}) as Record<string, unknown>;
  const page = typeof raw.page === 'number' ? raw.page : 1;
  const pageSize = typeof raw.pageSize === 'number' ? raw.pageSize : 20;
  const data = Array.isArray(raw.data) ? raw.data : [];
  const total = typeof raw.total === 'number' ? raw.total : data.length;

  return {
    data: data as unknown as JustificativaEquipeListResponse['data'],
    total,
    page,
    pageSize,
  };
}

function normalizeCasosResponse(input: unknown): CasoJustificativaEquipeListResponse {
  const raw = (input ?? {}) as Record<string, unknown>;
  const page = typeof raw.page === 'number' ? raw.page : 1;
  const pageSize = typeof raw.pageSize === 'number' ? raw.pageSize : 20;
  const items = Array.isArray(raw.items) ? raw.items : [];
  const total = typeof raw.total === 'number' ? raw.total : items.length;

  return {
    items: items as unknown as CasoJustificativaEquipeListResponse['items'],
    total,
    page,
    pageSize,
  };
}

export default async function JustificativasEquipePage() {
  const [justificativasResult, casosResult] = await Promise.all([
    listJustificativasEquipe({
      status: 'pendente',
      page: 1,
      pageSize: 20,
    }),
    listCasosJustificativaEquipe({
      status: 'pendente',
      page: 1,
      pageSize: 20,
    }),
  ]);

  if (justificativasResult.redirectToLogin || casosResult.redirectToLogin) {
    redirect('/login');
  }

  const initialJustificativas =
    justificativasResult.success && justificativasResult.data
      ? normalizeJustificativasResponse(justificativasResult.data)
      : undefined;

  const initialCasos =
    casosResult.success && casosResult.data
      ? normalizeCasosResponse(casosResult.data)
      : undefined;

  return (
    <JustificativasEquipePageClient
      initialJustificativas={initialJustificativas}
      initialCasos={initialCasos}
    />
  );
}
