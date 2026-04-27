import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export function ShellHeaderBlock({
  title,
  subtitle,
  badge,
  actions
}: {
  title: string;
  subtitle: string;
  badge?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-start md:justify-between">
      <div className="space-y-2">
        <div className="flex items-center gap-2">{badge}</div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">{title}</h1>
        <p className="max-w-3xl text-sm leading-6 text-slate-600">{subtitle}</p>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function ShellKpiRow({ items }: { items: Array<{ label: string; value: string; tone?: 'default' | 'accent' }> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
          <p
            className={cn('mt-1 text-base font-semibold', item.tone === 'accent' ? 'text-blue-700' : 'text-slate-900')}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function ShellSectionPanel({
  title,
  description,
  children,
  className
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-xl border border-slate-200 bg-white p-5 shadow-sm', className)}>
      <header className="mb-4 space-y-1 border-b border-slate-100 pb-4">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description ? <p className="text-sm text-slate-600">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}
