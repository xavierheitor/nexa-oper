import { listEquipesSupervisores } from '@/lib/actions/equipeSupervisor/list';
import { listSupervisores } from '@/lib/actions/supervisor/list';
import type { PaginatedResult } from '@/lib/types/common';
import SupervisorPageClient from '@/ui/pages/dashboard/cadastro/SupervisorPageClient';
import { EquipeSupervisor, Supervisor } from '@nexa-oper/db';
import { redirect } from 'next/navigation';

export default async function SupervisorPage() {
  const [supervisoresResult, vinculosResult] = await Promise.all([
    listSupervisores({
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
      include: {
        contrato: true,
      },
    }),
    listEquipesSupervisores({
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
      include: { supervisor: true, equipe: true },
    }),
  ]);

  if (supervisoresResult.redirectToLogin || vinculosResult.redirectToLogin) {
    redirect('/login');
  }

  const supervisoresInitialData: PaginatedResult<Supervisor> | undefined =
    supervisoresResult.success && supervisoresResult.data
      ? supervisoresResult.data
      : undefined;

  const vinculosInitialData: PaginatedResult<EquipeSupervisor> | undefined =
    vinculosResult.success && vinculosResult.data
      ? vinculosResult.data
      : undefined;

  return (
    <SupervisorPageClient
      supervisoresInitialData={supervisoresInitialData}
      vinculosInitialData={vinculosInitialData}
    />
  );
}
