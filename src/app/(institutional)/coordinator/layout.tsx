import { AppShell } from '@/components/shell/app-shell';

export default function CoordinatorLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="coordinator">{children}</AppShell>;
}
