import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type InstitutionalPageTemplateProps = {
  title: string;
  subtitle?: string;
  contextSummary?: ReactNode;
  actionsBar?: ReactNode;
  primaryRegion: ReactNode;
  activityRegion?: ReactNode;
};

function RegionCard({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function InstitutionalPageTemplate({
  title,
  subtitle,
  contextSummary,
  actionsBar,
  primaryRegion,
  activityRegion
}: InstitutionalPageTemplateProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle>{title}</CardTitle>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </CardHeader>
      </Card>

      {contextSummary ? <RegionCard title="Context Summary">{contextSummary}</RegionCard> : null}
      {actionsBar ? <RegionCard title="Actions">{actionsBar}</RegionCard> : null}

      <RegionCard title="Primary Data" className={cn(activityRegion ? undefined : 'mb-0')}>
        {primaryRegion}
      </RegionCard>

      {activityRegion ? <RegionCard title="Activity & History">{activityRegion}</RegionCard> : null}
    </div>
  );
}

export function EntityListButton({
  selected,
  onClick,
  children
}: {
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  const className = cn(
    'w-full rounded border px-3 py-2 text-left transition',
    onClick && 'hover:bg-slate-50',
    selected && 'border-blue-600 bg-blue-50'
  );

  if (!onClick) {
    return <div className={className}>{children}</div>;
  }

  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className={className}>
      {children}
    </button>
  );
}
