import { listBases } from '@/lib/actions/base/list';
import { listContratos } from '@/lib/actions/contrato/list';
import RelatoriosEscalasPageClient from '@/ui/pages/dashboard/relatorios/RelatoriosEscalasPageClient';
import type { Base, Contrato } from '@nexa-oper/db';
import { redirect } from 'next/navigation';

export default async function RelatoriosEscalasPage() {
  const [contratosResult, basesResult] = await Promise.all([
    listContratos({ page: 1, pageSize: 1000, orderBy: 'nome', orderDir: 'asc' }),
    listBases({ page: 1, pageSize: 1000, orderBy: 'nome', orderDir: 'asc' }),
  ]);

  if (contratosResult.redirectToLogin || basesResult.redirectToLogin) {
    redirect('/login');
  }

  const initialContratos: Contrato[] =
    contratosResult.success && contratosResult.data
      ? contratosResult.data.data
      : [];

  const initialBases: Base[] =
    basesResult.success && basesResult.data
      ? basesResult.data.data
      : [];

  return (
    <RelatoriosEscalasPageClient
      initialContratos={initialContratos}
      initialBases={initialBases}
    />
  );
}
