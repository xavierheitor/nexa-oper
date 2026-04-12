import dynamic from 'next/dynamic';

const MobileAppVersionPageClient = dynamic(
  () => import('@/ui/pages/dashboard/cadastro/mobile-app-version/MobileAppVersionPageClient'),
  { ssr: false } // Client-side only API fetch para evitar problemas de SSR sem token (se o tokenNextAuth nao for passado via cookie pro SSR)
);

export const metadata = {
  title: 'Versão Mobile App | Nexa',
};

export default function MobileAppVersionPage() {
  return <MobileAppVersionPageClient />;
}
