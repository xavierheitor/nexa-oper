import { listBases } from '@/lib/actions/base/list';
import { listTiposEquipe } from '@/lib/actions/tipoEquipe/list';
import TurnosPageClient from '@/ui/pages/dashboard/turnos/TurnosPageClient';
import { redirect } from 'next/navigation';

interface OptionItem {
  id: number;
  nome: string;
}

function mapOptions(input: unknown): OptionItem[] {
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
    .filter((item): item is OptionItem => item !== null);
}

export default async function TurnosPage() {
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

  const initialBases = mapOptions(basesResult.success ? basesResult.data?.data : []);
  const initialTiposEquipe = mapOptions(
    tiposEquipeResult.success ? tiposEquipeResult.data?.data : []
  );

  return (
    <TurnosPageClient
      initialBases={initialBases}
      initialTiposEquipe={initialTiposEquipe}
    />
  );
}
