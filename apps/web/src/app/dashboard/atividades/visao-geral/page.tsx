import { listAtividadeExecucoes } from '@/lib/actions/atividade/listExecucoes';
import type { AtividadeExecucaoPaginated } from '@/lib/types/atividadeDashboard';
import AtividadesVisaoGeralPageClient from '@/ui/pages/dashboard/atividades/AtividadesVisaoGeralPageClient';
import { redirect } from 'next/navigation';

export default async function AtividadesVisaoGeralPage() {
  const result = await listAtividadeExecucoes({
    page: 1,
    pageSize: 10,
    orderBy: 'createdAt',
    orderDir: 'desc',
  });

  if (result.redirectToLogin) {
    redirect('/login');
  }

  const initialData: AtividadeExecucaoPaginated | undefined =
    result.success && result.data
      ? (result.data as AtividadeExecucaoPaginated)
      : undefined;

  return <AtividadesVisaoGeralPageClient initialData={initialData} />;
}
