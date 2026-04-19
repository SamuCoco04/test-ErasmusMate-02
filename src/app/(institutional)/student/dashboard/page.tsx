'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/states/loading-state';
import { ErrorState } from '@/components/states/error-state';

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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Institutional Mobility Dashboard (WF-001 + WF-006)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Mobility read model, applicability overview, deadline pressure and audit visibility.
        </CardContent>
      </Card>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}

      {data ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mobility record</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <strong>Institution:</strong> {data.dashboard.mobilityRecord.institution.name}
              </p>
              <p>
                <strong>Coordinator:</strong> {data.dashboard.mobilityRecord.coordinator.fullName}
              </p>
              <p>
                <strong>Destination:</strong> {data.dashboard.mobilityRecord.destinationCity}
              </p>
              <p>
                <strong>Type / Phase:</strong> {data.dashboard.mobilityRecord.mobilityType} / {data.dashboard.mobilityRecord.mobilityPhase}
              </p>
              <p>
                <strong>Dates:</strong> {new Date(data.dashboard.mobilityRecord.mobilityStart).toLocaleDateString()} -{' '}
                {new Date(data.dashboard.mobilityRecord.mobilityEnd).toLocaleDateString()}
              </p>
              <Badge>{data.dashboard.mobilityRecord.state}</Badge>
            </CardContent>
          </Card>

          <div className="grid gap-3 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Submissions</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">{data.dashboard.summary.pendingSubmissions} pending of {data.dashboard.summary.submissionsTotal}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Exceptions</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">{data.dashboard.summary.exceptionsPending} open of {data.dashboard.summary.exceptionsTotal}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Deadlines</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">{data.dashboard.summary.upcomingDeadlines} pending obligations</CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Applicable procedures (REQ-018)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {data.dashboard.procedures.map((procedure) => (
                <p key={procedure.id}>
                  <strong>{procedure.title}</strong> <span className="text-muted-foreground">({procedure.phase})</span>
                </p>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Audit trail (critical actions)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs">
              {data.audit.map((event) => (
                <p key={event.id}>
                  {new Date(event.createdAt).toLocaleString()} · {event.actor.fullName} · {event.actionType}
                  {event.newState ? ` -> ${event.newState}` : ''}
                </p>
              ))}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
