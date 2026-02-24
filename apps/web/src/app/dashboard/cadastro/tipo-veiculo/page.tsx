import { listTiposVeiculo } from '@/lib/actions/tipoVeiculo/list';
import type { PaginatedResult } from '@/lib/types/common';
import TipoVeiculoPageClient from '@/ui/pages/dashboard/cadastro/TipoVeiculoPageClient';
import { TipoVeiculo } from '@nexa-oper/db';
import { redirect } from 'next/navigation';

export default async function TipoVeiculoPage() {
  const result = await listTiposVeiculo({
    page: 1,
    pageSize: 10,
    orderBy: 'id',
    orderDir: 'desc',
  });

  if (result.redirectToLogin) {
    redirect('/login');
  }

  const initialData: PaginatedResult<TipoVeiculo> | undefined =
    result.success && result.data ? result.data : undefined;

  return <TipoVeiculoPageClient initialData={initialData} />;
}
