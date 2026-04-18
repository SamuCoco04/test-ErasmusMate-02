import { AppShell } from '@/components/shell/app-shell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="administrator">{children}</AppShell>;
}
