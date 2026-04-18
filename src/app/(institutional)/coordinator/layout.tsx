'use client';

import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/shell/app-shell';
import { bootstrapDemoUserId } from '@/lib/demo-identity';

export default function CoordinatorLayout({ children }: { children: React.ReactNode }) {
  const params = useSearchParams();
  const userId = bootstrapDemoUserId('coordinator', params.get('userId'));

  return <AppShell role="coordinator" userId={userId}>{children}</AppShell>;
}
