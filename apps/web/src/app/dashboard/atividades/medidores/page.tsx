import { listAtividadeMedidores } from '@/lib/actions/atividade/listMedidores';
import type { AtividadeMedidorPaginated } from '@/lib/types/atividadeDashboard';
import AtividadesMedidoresPageClient from '@/ui/pages/dashboard/atividades/AtividadesMedidoresPageClient';
import { redirect } from 'next/navigation';

export default async function AtividadesMedidoresPage() {
  const result = await listAtividadeMedidores({
    page: 1,
    pageSize: 10,
    orderBy: 'createdAt',
    orderDir: 'desc',
  });

  if (result.redirectToLogin) {
    redirect('/login');
  }

  const initialData: AtividadeMedidorPaginated | undefined =
    result.success && result.data
      ? (result.data as AtividadeMedidorPaginated)
      : undefined;

  return <AtividadesMedidoresPageClient initialData={initialData} />;
}
