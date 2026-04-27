import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type WorkflowTone = 'overdue' | 'pending' | 'approved' | 'flagged' | 'neutral';

const toneClasses: Record<WorkflowTone, string> = {
  overdue: 'bg-rose-100 text-rose-800',
  pending: 'bg-amber-100 text-amber-900',
  approved: 'bg-emerald-100 text-emerald-800',
  flagged: 'bg-fuchsia-100 text-fuchsia-800',
  neutral: 'bg-slate-100 text-slate-700'
};

export function resolveWorkflowTone(state?: string | null): WorkflowTone {
  const value = (state || '').toLowerCase();

  if (value.includes('overdue') || value.includes('deadline_missed') || value.includes('missed') || value.includes('rejected')) {
    return 'overdue';
  }

  if (
    value.includes('approved') ||
    value.includes('accepted') ||
    value.includes('resolved') ||
    value.includes('cleared') ||
    value.includes('fulfilled') ||
    value.includes('completed') ||
    value.includes('closed') ||
    value === 'active' // strict match: avoids false-positive on 'profile_active_private' etc.
  ) {
    return 'approved';
  }

  if (value.includes('flag') || value.includes('threshold_hidden') || value.includes('in_review') || value.includes('restricted')) {
    return 'flagged';
  }

  if (
    value.includes('pending') ||
    value.includes('review') ||
    value.includes('draft') ||
    value.includes('reopen') ||
    value.includes('submitted') ||
    value.includes('reported') ||
    value.includes('upcoming') ||
    value.includes('terminated')
  ) {
    return 'pending';
  }

  return 'neutral';
}

export function WorkflowStateBadge({ state, className }: { state: string; className?: string }) {
  const tone = resolveWorkflowTone(state);
  return <Badge className={cn(toneClasses[tone], className)}>{state}</Badge>;
}

export function DashboardHero({ title, description, badge, context }: { title: string; description: string; badge?: ReactNode; context: ReactNode }) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">{badge}</div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>{context}</CardContent>
    </Card>
  );
}

export function ActionRequiredRail({
  items,
  emptyLabel
}: {
  items: Array<{ id: string; title: string; hint: string; href: string; state: string }>;
  emptyLabel: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Action required</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length ? (
          items.map((item) => (
            <Link key={item.id} href={item.href} className="flex items-start justify-between gap-3 rounded-lg border p-3 hover:bg-slate-50">
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.hint}</p>
              </div>
              <WorkflowStateBadge state={item.state} />
            </Link>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardKpiRow({
  items
}: {
  items: Array<{ label: string; value: string; supporting: string; tone?: WorkflowTone }>;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="space-y-1 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.label}</p>
            <p className="text-xl font-semibold">{item.value}</p>
            <p className="text-xs text-muted-foreground">{item.supporting}</p>
            {item.tone ? <WorkflowStateBadge state={item.tone} className="capitalize" /> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function DashboardSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
