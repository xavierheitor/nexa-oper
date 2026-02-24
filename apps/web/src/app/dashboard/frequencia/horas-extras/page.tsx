import { listHorasExtras } from '@/lib/actions/turno-realizado/listHorasExtras';
import type { HoraExtraListResponse } from '@/lib/schemas/turnoRealizadoSchema';
import HorasExtrasPageClient from '@/ui/pages/dashboard/frequencia/HorasExtrasPageClient';
import { redirect } from 'next/navigation';

export default async function HorasExtrasPage() {
  const result = await listHorasExtras({
    page: 1,
    pageSize: 20,
  });

  if (result.redirectToLogin) {
    redirect('/login');
  }

  const initialData: HoraExtraListResponse | undefined =
    result.success && result.data
      ? ({
          data: (result.data as any).data ?? [],
          pagination: {
            page: (result.data as any).page ?? 1,
            pageSize: (result.data as any).pageSize ?? 20,
            total: (result.data as any).total ?? 0,
            totalPages: (result.data as any).totalPages ?? 0,
          },
        } as HoraExtraListResponse)
      : undefined;

  return <HorasExtrasPageClient initialData={initialData} />;
}
