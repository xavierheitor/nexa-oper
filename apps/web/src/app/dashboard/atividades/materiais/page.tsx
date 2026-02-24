import { listAtividadeMateriais } from '@/lib/actions/atividade/listMateriais';
import type { AtividadeMaterialPaginated } from '@/lib/types/atividadeDashboard';
import AtividadesMateriaisPageClient from '@/ui/pages/dashboard/atividades/AtividadesMateriaisPageClient';
import { redirect } from 'next/navigation';

export default async function AtividadesMateriaisPage() {
  const result = await listAtividadeMateriais({
    page: 1,
    pageSize: 10,
    orderBy: 'createdAt',
    orderDir: 'desc',
  });

  if (result.redirectToLogin) {
    redirect('/login');
  }

  const initialData: AtividadeMaterialPaginated | undefined =
    result.success && result.data
      ? (result.data as AtividadeMaterialPaginated)
      : undefined;

  return <AtividadesMateriaisPageClient initialData={initialData} />;
}
