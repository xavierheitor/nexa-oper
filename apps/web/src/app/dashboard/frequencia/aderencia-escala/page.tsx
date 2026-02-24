import { listBases } from '@/lib/actions/base/list';
import { listTiposEquipe } from '@/lib/actions/tipoEquipe/list';
import AderenciaEscalaPageClient from '@/ui/pages/dashboard/frequencia/AderenciaEscalaPageClient';
import { redirect } from 'next/navigation';

interface BaseOption {
  id: number;
  nome: string;
}

interface TipoEquipeOption {
  id: number;
  nome: string;
}

function mapOptions(input: unknown): Array<{ id: number; nome: string }> {
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
    .filter((item): item is { id: number; nome: string } => item !== null);
}

export default async function AderenciaEscalaPage() {
  const [basesResult, tiposEquipeResult] = await Promise.all([
    listBases({
      page: 1,
      pageSize: 1000,
      orderBy: 'nome',
      orderDir: 'asc',
    }),
    listTiposEquipe({
      page: 1,
      pageSize: 1000,
      orderBy: 'nome',
      orderDir: 'asc',
    }),
  ]);

  if (basesResult.redirectToLogin || tiposEquipeResult.redirectToLogin) {
    redirect('/login');
  }

  const initialBases: BaseOption[] = mapOptions(
    basesResult.success ? basesResult.data?.data : []
  );
  const initialTiposEquipe: TipoEquipeOption[] = mapOptions(
    tiposEquipeResult.success ? tiposEquipeResult.data?.data : []
  );

  return (
    <AderenciaEscalaPageClient
      initialBases={initialBases}
      initialTiposEquipe={initialTiposEquipe}
    />
  );
}
