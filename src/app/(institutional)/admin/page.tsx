import Link from 'next/link';
import { ActionRequiredRail, DashboardHero, DashboardKpiRow, DashboardSection, WorkflowStateBadge } from '@/components/shell/role-dashboard-primitives';

export default function AdminPage() {
  return (
    <div className="space-y-4">
      <DashboardHero
        title="Administrator governance dashboard"
        description="Institutional governance remains primary; social moderation stays role-restricted and isolated as a secondary support workflow."
        badge={<WorkflowStateBadge state="flagged" />}
        context={
          <div className="grid gap-2 text-sm md:grid-cols-2">
            <p><span className="font-medium">Primary responsibility:</span> Governance and risk controls across Erasmus operational flows.</p>
            <p><span className="font-medium">Moderation responsibility:</span> Access threshold-hidden and reported social content cases.</p>
          </div>
        }
      />

      <DashboardKpiRow
        items={[
          { label: 'Governance lane', value: 'Institutional', supporting: 'Institutional workflows remain first-class', tone: 'approved' },
          { label: 'Moderation lane', value: 'Secondary', supporting: 'Social-support moderation remains separated', tone: 'flagged' },
          { label: 'Queue source', value: 'Backend API', supporting: 'No dashboard-only state simulation', tone: 'pending' },
          { label: 'Auditability', value: 'Required', supporting: 'Outcome summary captured on every moderation action', tone: 'approved' }
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <ActionRequiredRail
          items={[
            {
              id: 'open-moderation',
              title: 'Open moderation command center',
              hint: 'Review threshold-hidden, reported, and in-review cases.',
              href: '/admin/moderation?userId=admin-1',
              state: 'flagged'
            }
          ]}
          emptyLabel="No role-restricted actions available."
        />

        <DashboardSection title="Moderation entry points">
          <div className="space-y-2 text-sm">
            <Link href="/admin/moderation?userId=admin-1" className="block rounded border p-3 hover:bg-slate-50">
              <p className="font-medium">Moderation queue</p>
              <p className="text-xs text-muted-foreground">Process case actions: hide, remove, restrict, maintain visible, or clear.</p>
            </Link>
            <p className="text-xs text-muted-foreground">All actions route through the existing moderation API and preserve backend case transitions.</p>
          </div>
        </DashboardSection>
      </div>
    </div>
  );
}
