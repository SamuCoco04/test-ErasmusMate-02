'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ErrorState } from '@/components/states/error-state';
import {
  ActionRequiredRail,
  DashboardHero,
  DashboardKpiRow,
  DashboardSection,
  WorkflowStateBadge,
  resolveWorkflowTone
} from '@/components/shell/role-dashboard-primitives';

const ACTIONS = ['hide', 'remove', 'restrict', 'maintain_visible', 'clear'] as const;

type ModerationCase = {
  id: string;
  targetType: string;
  caseState: string;
  thresholdTriggered: boolean;
  targetContent: { id: string; title: string; body: string; moderationState: string; author: { fullName: string } } | null;
  reports: Array<{ id: string; reportReason: string; reportDetails: string | null; reporter: { fullName: string } }>;
};

export default function AdminModerationPage() {
  const params = useSearchParams();
  const userId = params.get('userId') || 'admin-1';
  const caseIdFromQuery = params.get('caseId');

  const [queue, setQueue] = useState<ModerationCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [summary, setSummary] = useState('');
  const [error, setError] = useState<string | null>(null);

  const selected = queue.find((item) => item.id === selectedCaseId) || null;

  async function load() {
    setError(null);
    const response = await fetch(`/api/admin/moderation?userId=${userId}`);
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Failed to load moderation queue');
      return;
    }
    setQueue(data.queue || []);
    if (caseIdFromQuery && data.queue?.some((item: ModerationCase) => item.id === caseIdFromQuery)) {
      setSelectedCaseId(caseIdFromQuery);
      return;
    }
    if (!selectedCaseId && data.queue?.length) setSelectedCaseId(data.queue[0].id);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, caseIdFromQuery]);

  async function apply(action: (typeof ACTIONS)[number]) {
    if (!selectedCaseId) return;
    const response = await fetch('/api/admin/moderation', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, caseId: selectedCaseId, action, outcomeSummary: summary || `Applied action: ${action}` })
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Failed moderation action');
      return;
    }
    setSummary('');
    await load();
  }

  const flaggedCount = useMemo(() => queue.filter((item) => resolveWorkflowTone(item.caseState) === 'flagged').length, [queue]);
  const pendingCount = useMemo(() => queue.filter((item) => resolveWorkflowTone(item.caseState) === 'pending').length, [queue]);

  return (
    <div className="space-y-4">
      <DashboardHero
        title="Moderation command center"
        description="Role-restricted queue for threshold-hidden and reported content. Preserve institutional-social separation while enforcing moderation policy."
        badge={<WorkflowStateBadge state={flaggedCount ? 'flagged' : 'approved'} />}
        context={
          <div className="space-y-1 text-sm">
            <p>Only administrators can access this queue and execute moderation transitions.</p>
            <Link href="/admin" className="text-xs text-blue-700 underline">Back to governance dashboard</Link>
          </div>
        }
      />

      {error ? <ErrorState message={error} /> : null}

      <DashboardKpiRow
        items={[
          { label: 'Queue total', value: `${queue.length}`, supporting: 'All moderation cases currently visible to admin', tone: queue.length ? 'pending' : 'approved' },
          { label: 'Flagged cases', value: `${flaggedCount}`, supporting: 'Threshold-hidden, in-review, or restricted signals', tone: flaggedCount ? 'flagged' : 'approved' },
          { label: 'Pending cases', value: `${pendingCount}`, supporting: 'Reported/pending review decisions', tone: pendingCount ? 'pending' : 'approved' },
          {
            label: 'Selected case',
            value: selected ? selected.id.slice(0, 8) : 'None',
            supporting: selected ? selected.caseState : 'Select a queue case to inspect',
            tone: selected ? resolveWorkflowTone(selected.caseState) : 'neutral'
          }
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <ActionRequiredRail
          items={queue.map((item) => ({
            id: item.id,
            title: `${item.targetType} moderation case`,
            hint: item.thresholdTriggered ? 'Threshold triggered: visibility already blocked.' : 'Reported content requires explicit decision.',
            href: `/admin/moderation?userId=${userId}&caseId=${item.id}`,
            state: item.caseState
          }))}
          emptyLabel="No moderation cases in queue."
        />

        <DashboardSection title="Queue / deadline block">
          <div className="space-y-2 text-sm">
            {queue.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedCaseId(item.id)}
                className={`w-full rounded border p-2 text-left ${selectedCaseId === item.id ? 'border-blue-600 bg-blue-50/50' : ''}`}
              >
                <p className="font-medium">{item.targetType} · {item.id}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <WorkflowStateBadge state={item.caseState} />
                  {item.thresholdTriggered ? <WorkflowStateBadge state="flagged" /> : null}
                </div>
              </button>
            ))}
          </div>
        </DashboardSection>
      </div>

      {selected ? (
        <DashboardSection title="Recent activity / case detail">
          <div className="space-y-3 text-sm">
            <p><span className="font-medium">Case state:</span> <WorkflowStateBadge state={selected.caseState} className="ml-2" /></p>
            {selected.targetContent ? (
              <div className="rounded border p-3">
                <p className="font-medium">{selected.targetContent.title}</p>
                <p>{selected.targetContent.body}</p>
                <p className="text-xs text-muted-foreground">Author: {selected.targetContent.author.fullName} · moderation: {selected.targetContent.moderationState}</p>
              </div>
            ) : null}

            <div className="rounded border p-3">
              <p className="mb-2 font-medium">Recent reports</p>
              {selected.reports.map((report) => (
                <div key={report.id} className="mb-2 rounded border p-2 text-xs">
                  <p>{report.reportReason}</p>
                  <p className="text-muted-foreground">Reporter: {report.reporter.fullName}</p>
                  {report.reportDetails ? <p>{report.reportDetails}</p> : null}
                </div>
              ))}
            </div>

            <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Outcome summary for audit trail" />
            <div className="flex flex-wrap gap-2">
              {ACTIONS.map((action) => (
                <Button key={action} variant={action === 'remove' ? 'destructive' : 'outline'} onClick={() => apply(action)}>
                  {action}
                </Button>
              ))}
            </div>
          </div>
        </DashboardSection>
      ) : null}
    </div>
  );
}
