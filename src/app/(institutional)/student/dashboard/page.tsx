'use client';

import { useEffect, useMemo, useState } from 'react';
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

const MOBILITY_ID = 'mobility-1';

type DashboardPayload = {
  dashboard: {
    mobilityRecord: {
      id: string;
      state: string;
      destinationCity: string;
      mobilityType: string;
      mobilityPhase: string;
      mobilityStart: string;
      mobilityEnd: string;
      coordinator: { fullName: string };
      institution: { name: string };
    };
    summary: {
      submissionsTotal: number;
      pendingSubmissions: number;
      exceptionsTotal: number;
      exceptionsPending: number;
      upcomingDeadlines: number;
    };
    procedures: { id: string; title: string; phase: string }[];
  };
  audit: { id: string; actionType: string; createdAt: string; actor: { fullName: string }; newState?: string | null }[];
};

export default function StudentDashboardPage() {
  const params = useSearchParams();
  const userId = params.get('userId') || 'student-1';

  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/mobility-records?role=student&userId=${userId}&mobilityRecordId=${MOBILITY_ID}`);
        const payload = await response.json();

        if (!response.ok) {
          setError(payload.error || 'Failed to load dashboard');
          return;
        }

        setData(payload);
      } catch {
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId]);

  const actionRailItems = useMemo(() => {
    if (!data) return [];

    return [
      {
        id: 'submissions',
        title: `Submissions needing follow-up (${data.dashboard.summary.pendingSubmissions})`,
        hint: 'Review draft, rejected, or reopened submissions in your institutional flow.',
        href: `/student/submissions?userId=${userId}`,
        state: data.dashboard.summary.pendingSubmissions > 0 ? 'pending' : 'approved'
      },
      {
        id: 'exceptions',
        title: `Open exceptions (${data.dashboard.summary.exceptionsPending})`,
        hint: 'Track unresolved exception decisions that can block your mobility lifecycle.',
        href: `/student/exceptions?userId=${userId}`,
        state: data.dashboard.summary.exceptionsPending > 0 ? 'pending' : 'approved'
      },
      {
        id: 'deadlines',
        title: `Upcoming obligations (${data.dashboard.summary.upcomingDeadlines})`,
        hint: 'Deadline-sensitive procedures and due actions for the current mobility phase.',
        href: `/student/deadlines?userId=${userId}`,
        state: data.dashboard.summary.upcomingDeadlines > 0 ? 'pending' : 'approved'
      }
    ];
  }, [data, userId]);

  return (
    <div className="space-y-4">
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}

      {data ? (
        <>
          <DashboardHero
            title="Student institutional dashboard"
            description="Primary mobility context, workflow pressure indicators, and audit visibility for institutional actions."
            badge={<WorkflowStateBadge state={data.dashboard.mobilityRecord.state} />}
            context={
              <div className="grid gap-3 text-sm md:grid-cols-2">
                <p><span className="font-medium">Institution:</span> {data.dashboard.mobilityRecord.institution.name}</p>
                <p><span className="font-medium">Coordinator:</span> {data.dashboard.mobilityRecord.coordinator.fullName}</p>
                <p><span className="font-medium">Destination:</span> {data.dashboard.mobilityRecord.destinationCity}</p>
                <p><span className="font-medium">Type / phase:</span> {data.dashboard.mobilityRecord.mobilityType} / {data.dashboard.mobilityRecord.mobilityPhase}</p>
                <p className="md:col-span-2">
                  <span className="font-medium">Dates:</span> {new Date(data.dashboard.mobilityRecord.mobilityStart).toLocaleDateString()} -{' '}
                  {new Date(data.dashboard.mobilityRecord.mobilityEnd).toLocaleDateString()}
                </p>
              </div>
            }
          />

          <DashboardKpiRow
            items={[
              {
                label: 'Submissions',
                value: `${data.dashboard.summary.pendingSubmissions}/${data.dashboard.summary.submissionsTotal}`,
                supporting: 'Pending of total procedural submissions',
                tone: data.dashboard.summary.pendingSubmissions > 0 ? 'pending' : 'approved'
              },
              {
                label: 'Exceptions',
                value: `${data.dashboard.summary.exceptionsPending}/${data.dashboard.summary.exceptionsTotal}`,
                supporting: 'Open exception requests in institutional review',
                tone: data.dashboard.summary.exceptionsPending > 0 ? 'pending' : 'approved'
              },
              {
                label: 'Deadlines',
                value: `${data.dashboard.summary.upcomingDeadlines}`,
                supporting: 'Pending obligations in current mobility phase',
                tone: data.dashboard.summary.upcomingDeadlines > 0 ? 'pending' : 'approved'
              },
              {
                label: 'Mobility state',
                value: data.dashboard.mobilityRecord.state,
                supporting: 'Current record lifecycle state',
                tone: resolveWorkflowTone(data.dashboard.mobilityRecord.state)
              }
            ]}
          />

          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <ActionRequiredRail items={actionRailItems} emptyLabel="No institutional actions required right now." />

            <DashboardSection title="Applicable procedures (REQ-018)">
              <div className="space-y-2 text-sm">
                {data.dashboard.procedures.map((procedure) => (
                  <div key={procedure.id} className="rounded border p-2">
                    <p className="font-medium">{procedure.title}</p>
                    <p className="text-xs text-muted-foreground">Phase: {procedure.phase}</p>
                  </div>
                ))}
              </div>
            </DashboardSection>
          </div>

          <DashboardSection title="Recent activity">
            <div className="space-y-2 text-xs">
              {data.audit.map((event) => (
                <div key={event.id} className="rounded border p-2">
                  <p>{new Date(event.createdAt).toLocaleString()}</p>
                  <p className="text-muted-foreground">{event.actor.fullName} · {event.actionType}</p>
                  {event.newState ? <WorkflowStateBadge state={event.newState} className="mt-1" /> : null}
                </div>
              ))}
            </div>
          </DashboardSection>
        </>
      ) : null}
    </div>
  );
}
