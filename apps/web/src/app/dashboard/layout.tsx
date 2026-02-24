import DashboardLayoutClient from '@/ui/pages/dashboard/DashboardLayoutClient';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
