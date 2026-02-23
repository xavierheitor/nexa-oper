import { listEletricistas } from '@/lib/actions/eletricista/list';
import { listEquipes } from '@/lib/actions/equipe/list';
import FrequenciaVisaoGeralPageClient from '@/ui/pages/dashboard/frequencia/FrequenciaVisaoGeralPageClient';
import { redirect } from 'next/navigation';

interface NamedOption {
  id: number;
  nome: string;
}

interface EletricistaOption extends NamedOption {
  matricula?: string;
}

function mapNamedOptions(input: unknown): NamedOption[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item) => {
      const value = item as { id?: unknown; nome?: unknown };
      const id =
        typeof value.id === 'number'
          ? value.id
          : Number(value.id);
      const nome = typeof value.nome === 'string' ? value.nome : '';

      if (!Number.isFinite(id) || id <= 0 || !nome.trim()) {
        return null;
      }

      return { id, nome };
    })
    .filter((item): item is NamedOption => item !== null);
}

function mapEletricistaOptions(input: unknown): EletricistaOption[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const mapped: EletricistaOption[] = [];

  for (const item of input) {
      const value = item as {
        id?: unknown;
        nome?: unknown;
        matricula?: unknown;
      };
      const id =
        typeof value.id === 'number'
          ? value.id
          : Number(value.id);
      const nome = typeof value.nome === 'string' ? value.nome : '';
      const matricula =
        typeof value.matricula === 'string' ? value.matricula : undefined;

      if (!Number.isFinite(id) || id <= 0 || !nome.trim()) {
        continue;
      }

      mapped.push({ id, nome, matricula });
    }

  return mapped;
}

export default async function FrequenciaVisaoGeralPage() {
  const [eletricistasResult, equipesResult] = await Promise.all([
    listEletricistas({
      page: 1,
      pageSize: 1000,
      orderBy: 'nome',
      orderDir: 'asc',
    }),
    listEquipes({
      page: 1,
      pageSize: 1000,
      orderBy: 'nome',
      orderDir: 'asc',
    }),
  ]);

  if (eletricistasResult.redirectToLogin || equipesResult.redirectToLogin) {
    redirect('/login');
  }

  const initialEletricistas = mapEletricistaOptions(
    eletricistasResult.success ? eletricistasResult.data?.data : []
  );

  const initialEquipes = mapNamedOptions(
    equipesResult.success ? equipesResult.data?.data : []
  );

  return (
    <FrequenciaVisaoGeralPageClient
      initialEletricistas={initialEletricistas}
      initialEquipes={initialEquipes}
    />
  );
}
