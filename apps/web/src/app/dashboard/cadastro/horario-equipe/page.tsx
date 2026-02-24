import { listHorarioAberturaCatalogo } from '@/lib/actions/escala/horarioAberturaCatalogo';
import type { PaginatedResult } from '@/lib/types/common';
import HorarioEquipePageClient, {
  HorarioAberturaCatalogo,
} from '@/ui/pages/dashboard/cadastro/HorarioEquipePageClient';
import { redirect } from 'next/navigation';

export default async function HorarioEquipePage() {
  const result = await listHorarioAberturaCatalogo({
    page: 1,
    pageSize: 10,
    orderBy: 'nome',
    orderDir: 'asc',
  });

  if (result.redirectToLogin) {
    redirect('/login');
  }

  const initialData: PaginatedResult<HorarioAberturaCatalogo> | undefined =
    result.success && result.data ? result.data : undefined;

  return <HorarioEquipePageClient initialData={initialData} />;
}
