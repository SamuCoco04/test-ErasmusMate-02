'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ErrorState } from '@/components/states/error-state';
import { LoadingState } from '@/components/states/loading-state';
import {
  ActionRequiredRail,
  DashboardHero,
  DashboardKpiRow,
  DashboardSection,
  WorkflowStateBadge,
  resolveWorkflowTone
} from '@/components/shell/role-dashboard-primitives';
import type { CoordinatorDeadlineItem } from '@/modules/institutional/types';

type QueueItem = {
  id: string;
  state: string;
  student: { fullName: string };
  procedureDefinition: { title: string };
  events: { id: string; toState: string; rationale?: string | null; createdAt: string }[];
};

export default function CoordinatorDashboardPage() {
  const params = useSearchParams();
  const userId = params.get('userId') || 'coordinator-1';

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [deadlines, setDeadlines] = useState<CoordinatorDeadlineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [queueResponse, deadlineResponse] = await Promise.all([
        fetch(`/api/submissions?role=coordinator&userId=${userId}`),
        fetch(`/api/deadlines?role=coordinator&userId=${userId}`)
      ]);

      const [queuePayload, deadlinePayload] = await Promise.all([queueResponse.json(), deadlineResponse.json()]);

      if (!queueResponse.ok) {
        setError(queuePayload.error || 'Failed to load coordinator queue');
        return;
      }

      if (!deadlineResponse.ok) {
        setError(deadlinePayload.error || 'Failed to load coordinator deadlines');
        return;
      }

      setQueue(queuePayload.queue || []);
      setDeadlines(deadlinePayload.deadlines || []);
    } catch {
      setError('Failed to load coordinator dashboard');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const recentActivity = useMemo(
    () =>
      queue
        .flatMap((item) =>
          item.events.map((event) => ({
            id: event.id,
            createdAt: event.createdAt,
            submissionId: item.id,
            student: item.student.fullName,
            toState: event.toState,
            rationale: event.rationale
          }))
        )
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .slice(0, 6),
    [queue]
  );

  const orderedDeadlines = useMemo(
    () => [...deadlines].sort((a, b) => +new Date(a.overrideDueAt || a.dueAt) - +new Date(b.overrideDueAt || b.dueAt)).slice(0, 5),
    [deadlines]
  );

  const pendingQueue = queue.filter((item) => resolveWorkflowTone(item.state) === 'pending' || resolveWorkflowTone(item.state) === 'flagged');
  const overdueDeadlines = deadlines.filter((item) => resolveWorkflowTone(item.effectiveState) === 'overdue').length;

  return (
    <div className="space-y-4">
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}

      {!loading && !error ? (
        <>
          <DashboardHero
            title="Coordinator operational dashboard"
            description="Review pressure, deadline-sensitive procedures, and recent workflow transitions for mobility governance."
            badge={<WorkflowStateBadge state={overdueDeadlines > 0 ? 'overdue' : 'pending'} />}
            context={
              <div className="grid gap-2 text-sm md:grid-cols-2">
                <p><span className="font-medium">Queue focus:</span> Active student submissions requiring coordinator action.</p>
                <p><span className="font-medium">Deadline focus:</span> Obligations sorted by risk and due date.</p>
                <p className="md:col-span-2 text-muted-foreground">Institutional core remains primary: approvals, rejections, reopens, and deadline compliance are tracked through backend states.</p>
              </div>
            }
          />

          <DashboardKpiRow
            items={[
              { label: 'Queue size', value: `${queue.length}`, supporting: 'Total submissions in coordinator queue', tone: queue.length ? 'pending' : 'approved' },
              {
                label: 'Action required',
                value: `${pendingQueue.length}`,
                supporting: 'Items currently pending review/review follow-up',
                tone: pendingQueue.length ? 'pending' : 'approved'
              },
              {
                label: 'Deadlines at risk',
                value: `${overdueDeadlines}`,
                supporting: 'Overdue or missed states from effective deadline state',
                tone: overdueDeadlines ? 'overdue' : 'approved'
              },
              {
                label: 'Recent transitions',
                value: `${recentActivity.length}`,
                supporting: 'Most recent queue state changes',
                tone: recentActivity.length ? 'flagged' : 'approved'
              }
            ]}
          />

          <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
            <ActionRequiredRail
              items={pendingQueue.slice(0, 5).map((item) => ({
                id: item.id,
                title: `${item.student.fullName} · ${item.procedureDefinition.title}`,
                hint: 'Open review queue panel to run start/approve/reject/reopen actions.',
                href: `/coordinator/review-queue?userId=${userId}`,
                state: item.state
              }))}
              emptyLabel="No pending reviews at the moment."
            />

            <DashboardSection title="Deadline block">
              <div className="space-y-2 text-sm">
                {orderedDeadlines.length ? (
                  orderedDeadlines.map((deadline) => (
                    <div key={deadline.id} className="rounded border p-2">
                      <p className="font-medium">{deadline.title}</p>
                      <p className="text-xs text-muted-foreground">{deadline.mobilityRecord.student.fullName} · {new Date(deadline.overrideDueAt || deadline.dueAt).toLocaleString()}</p>
                      <WorkflowStateBadge state={deadline.effectiveState} className="mt-1" />
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No active deadlines in risk view.</p>
                )}
                <Link href={`/coordinator/deadlines?userId=${userId}`} className="text-xs font-medium text-blue-700 underline">Open full deadline management</Link>
              </div>
            </DashboardSection>
          </div>

          <DashboardSection title="Recent activity">
            <div className="space-y-2 text-xs">
              {recentActivity.length ? (
                recentActivity.map((event) => (
                  <div key={event.id} className="rounded border p-2">
                    <p>{new Date(event.createdAt).toLocaleString()} · {event.student}</p>
                    <p className="text-muted-foreground">Submission {event.submissionId}</p>
                    <WorkflowStateBadge state={event.toState} className="mt-1" />
                    {event.rationale ? <p className="mt-1 text-muted-foreground">Reason: {event.rationale}</p> : null}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No recent transitions yet.</p>
              )}
            </div>
          </DashboardSection>
        </>
      ) : null}
    </div>
  );
}
