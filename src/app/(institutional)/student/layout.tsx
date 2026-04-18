'use client';

import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/shell/app-shell';
import { bootstrapDemoUserId } from '@/lib/demo-identity';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const params = useSearchParams();
  const userId = bootstrapDemoUserId('student', params.get('userId'));

  return <AppShell role="student" userId={userId}>{children}</AppShell>;
}
