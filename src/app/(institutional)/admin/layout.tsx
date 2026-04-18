'use client';

import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/shell/app-shell';
import { bootstrapDemoUserId } from '@/lib/demo-identity';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const params = useSearchParams();
  const userId = bootstrapDemoUserId('administrator', params.get('userId'));

  return <AppShell role="administrator" userId={userId}>{children}</AppShell>;
}
