import { listTiposJustificativa } from '@/lib/actions/justificativa/listTipos';
import { listFaltas } from '@/lib/actions/turno-realizado/listFaltas';
import type { FaltaListResponse } from '@/lib/schemas/turnoRealizadoSchema';
import FaltasPageClient from '@/ui/pages/dashboard/frequencia/FaltasPageClient';
import dayjs from 'dayjs';
import { redirect } from 'next/navigation';

interface TipoJustificativaOption {
  id: number;
  nome: string;
}

function normalizeFaltasResponse(
  rawData: unknown,
  page: number,
  pageSize: number
): FaltaListResponse {
  if (!rawData || typeof rawData !== 'object') {
    return {
      data: [],
      pagination: { page, pageSize, total: 0, totalPages: 0 },
    };
  }

  const responseData = rawData as Record<string, unknown>;

  if ('data' in responseData && 'pagination' in responseData) {
    return responseData as unknown as FaltaListResponse;
  }

  if ('items' in responseData && 'total' in responseData) {
    const items = Array.isArray(responseData.items) ? responseData.items : [];
    const total =
      typeof responseData.total === 'number' ? responseData.total : items.length;
    return {
      data: items as FaltaListResponse['data'],
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  const items = Array.isArray(responseData.data)
    ? responseData.data
    : [];
  const total =
    typeof responseData.total === 'number' ? responseData.total : items.length;
  const rawPage =
    typeof responseData.page === 'number' ? responseData.page : page;
  const rawPageSize =
    typeof responseData.pageSize === 'number' ? responseData.pageSize : pageSize;
  const rawTotalPages =
    typeof responseData.totalPages === 'number'
      ? responseData.totalPages
      : Math.ceil(total / rawPageSize);

  return {
    data: items as FaltaListResponse['data'],
    pagination: {
      page: rawPage,
      pageSize: rawPageSize,
      total,
      totalPages: rawTotalPages,
    },
  };
}

function mapTipoJustificativaOptions(input: unknown): TipoJustificativaOption[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item) => {
      const value = item as { id?: unknown; nome?: unknown };
      const id = typeof value.id === 'number' ? value.id : Number(value.id);
      const nome = typeof value.nome === 'string' ? value.nome : '';

      if (!Number.isFinite(id) || id <= 0 || !nome.trim()) {
        return null;
      }

      return { id, nome };
    })
    .filter((item): item is TipoJustificativaOption => item !== null);
}

export default async function FaltasPage() {
  const page = 1;
  const pageSize = 20;
  const dataInicio = dayjs().startOf('month').toDate();
  const dataFim = dayjs().endOf('month').toDate();

  const [faltasResult, tiposJustificativaResult] = await Promise.all([
    listFaltas({
      page,
      pageSize,
      dataInicio,
      dataFim,
    }),
    listTiposJustificativa(),
  ]);

  if (faltasResult.redirectToLogin || tiposJustificativaResult.redirectToLogin) {
    redirect('/login');
  }

  const initialData =
    faltasResult.success && faltasResult.data
      ? normalizeFaltasResponse(faltasResult.data, page, pageSize)
      : undefined;
  const initialTiposJustificativa = mapTipoJustificativaOptions(
    tiposJustificativaResult.success ? tiposJustificativaResult.data : []
  );

  return (
    <FaltasPageClient
      initialData={initialData}
      initialTiposJustificativa={initialTiposJustificativa}
    />
  );
}
