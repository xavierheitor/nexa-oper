import DashboardLayoutClient from '@/ui/pages/dashboard/DashboardLayoutClient';

export const dynamic = 'force-dynamic';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
