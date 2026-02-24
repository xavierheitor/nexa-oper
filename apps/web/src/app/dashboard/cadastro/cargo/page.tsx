import { listCargos } from '@/lib/actions/cargo/list';
import type { PaginatedResult } from '@/lib/types/common';
import CargoPageClient from '@/ui/pages/dashboard/cadastro/CargoPageClient';
import { Cargo } from '@nexa-oper/db';
import { redirect } from 'next/navigation';

export default async function CargoPage() {
  const result = await listCargos({
    page: 1,
    pageSize: 10,
    orderBy: 'nome',
    orderDir: 'asc',
  });

  if (result.redirectToLogin) {
    redirect('/login');
  }

  const initialData: PaginatedResult<Cargo> | undefined =
    result.success && result.data ? result.data : undefined;

  return <CargoPageClient initialData={initialData} />;
}
