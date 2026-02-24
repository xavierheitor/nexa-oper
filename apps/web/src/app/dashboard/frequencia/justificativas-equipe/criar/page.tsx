import { listAllTiposJustificativa } from '@/lib/actions/tipo-justificativa/list';
import { listEquipes } from '@/lib/actions/equipe/list';
import CriarJustificativaEquipePageClient from '@/ui/pages/dashboard/frequencia/CriarJustificativaEquipePageClient';
import { redirect } from 'next/navigation';

interface SearchParams {
  casoId?: string | string[];
  equipeId?: string | string[];
  dataReferencia?: string | string[];
}

interface CriarJustificativaEquipePageProps {
  searchParams?: Promise<SearchParams>;
}

interface TipoJustificativaOption {
  id: number;
  nome: string;
  geraFalta?: boolean;
}

interface EquipeOption {
  id: number;
  nome: string;
}

function toSingle(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function toPositiveInt(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

function toValidIsoDate(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed.toISOString();
}

function mapTipos(input: unknown): TipoJustificativaOption[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const mapped: TipoJustificativaOption[] = [];
  for (const item of input) {
    const row = item as Record<string, unknown>;
    const id = typeof row.id === 'number' ? row.id : Number(row.id);
    const nome = typeof row.nome === 'string' ? row.nome : '';
    const geraFalta =
      typeof row.geraFalta === 'boolean' ? row.geraFalta : undefined;

    if (!Number.isFinite(id) || id <= 0 || !nome.trim()) {
      continue;
    }

    mapped.push({
      id,
      nome,
      geraFalta,
    });
  }

  return mapped;
}

function mapEquipes(input: unknown): EquipeOption[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item) => {
      const row = item as Record<string, unknown>;
      const id = typeof row.id === 'number' ? row.id : Number(row.id);
      const nome = typeof row.nome === 'string' ? row.nome : '';

      if (!Number.isFinite(id) || id <= 0 || !nome.trim()) {
        return null;
      }

      return {
        id,
        nome,
      };
    })
    .filter((item): item is EquipeOption => item !== null);
}

export default async function CriarJustificativaEquipePage({
  searchParams,
}: CriarJustificativaEquipePageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};

  const casoId = toPositiveInt(toSingle(resolvedSearchParams.casoId));
  const equipeId = toPositiveInt(toSingle(resolvedSearchParams.equipeId));
  const dataReferenciaIso = toValidIsoDate(
    toSingle(resolvedSearchParams.dataReferencia)
  );

  const [tiposResult, equipesResult] = await Promise.all([
    listAllTiposJustificativa(true),
    listEquipes({
      page: 1,
      pageSize: 1000,
      orderBy: 'nome',
      orderDir: 'asc',
    }),
  ]);

  if (tiposResult.redirectToLogin || equipesResult.redirectToLogin) {
    redirect('/login');
  }

  const initialTipos = mapTipos(tiposResult.success ? tiposResult.data : []);
  const initialEquipes = mapEquipes(
    equipesResult.success ? (equipesResult.data as { data?: unknown[] })?.data : []
  );

  return (
    <CriarJustificativaEquipePageClient
      initialTipos={initialTipos}
      initialEquipes={initialEquipes}
      initialCasoId={casoId}
      initialEquipeId={equipeId}
      initialDataReferenciaIso={dataReferenciaIso}
    />
  );
}
