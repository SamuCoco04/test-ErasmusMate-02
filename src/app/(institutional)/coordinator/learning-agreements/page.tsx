'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { LoadingState } from '@/components/states/loading-state';

type QueueAgreement = {
  id: string;
  state: string;
  student: { fullName: string };
  mobilityRecord: { id: string; destinationCity: string };
  rows: {
    id: string;
    status: string;
    revision: number;
    homeCourseCode: string;
    homeCourseName: string;
    destinationCourseCode: string;
    destinationCourseName: string;
    semester: string;
    ects: number;
    decisionRationale?: string | null;
  }[];
};

export default function CoordinatorLearningAgreementPage() {
  const params = useSearchParams();
  const userId = params.get('userId') || 'coordinator-1';

  const [queue, setQueue] = useState<QueueAgreement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rationale, setRationale] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/learning-agreements?role=coordinator&userId=${userId}`);
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to load queue');
      } else {
        setQueue(data.queue || []);
        setSelectedId((prev) => prev ?? data.queue?.[0]?.id ?? null);
      }
    } catch {
      setError('Failed to load queue');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const selected = queue.find((item) => item.id === selectedId) ?? null;
  const stats = useMemo(() => {
    if (!selected) return { approved: 0, denied: 0, pending: 0 };
    return {
      approved: selected.rows.filter((row) => row.status === 'APPROVED').length,
      denied: selected.rows.filter((row) => row.status === 'DENIED').length,
      pending: selected.rows.filter((row) => row.status === 'IN_REVIEW').length
    };
  }, [selected]);

  async function decide(rowId: string, decision: 'APPROVED' | 'DENIED') {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/learning-agreements/${selected.id}/rows/${rowId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, decision, rationale: rationale || undefined })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Decision failed');
      } else {
        setRationale('');
        await load();
      }
    } catch {
      setError('Decision failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Learning Agreement Review Queue</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Review assigned agreements row by row. Denials require rationale and aggregate state is derived from latest row revisions.
        </CardContent>
      </Card>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}

      {!loading && !queue.length ? <EmptyState title="No Learning Agreements in queue" /> : null}

      {queue.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assigned Queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {queue.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full rounded border p-2 text-left ${selectedId === item.id ? 'border-blue-600' : ''}`}
                >
                  <p className="font-medium">{item.student.fullName}</p>
                  <p className="text-xs text-muted-foreground">Mobility: {item.mobilityRecord.id} · {item.mobilityRecord.destinationCity}</p>
                  <Badge className="mt-1">{item.state}</Badge>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Agreement Detail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {selected ? (
                <>
                  <p className="font-mono text-xs text-muted-foreground">Agreement: {selected.id}</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded border p-2">Approved: {stats.approved}</div>
                    <div className="rounded border p-2">Denied: {stats.denied}</div>
                    <div className="rounded border p-2">Pending: {stats.pending}</div>
                  </div>

                  <Textarea value={rationale} onChange={(event) => setRationale(event.target.value)} placeholder="Rationale (required for deny)" />

                  <div className="space-y-2">
                    {selected.rows.map((row) => (
                      <div key={row.id} className="rounded border p-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{row.homeCourseCode} → {row.destinationCourseCode}</p>
                          <Badge>{row.status}</Badge>
                        </div>
                        <p className="text-xs">{row.homeCourseName} ⇄ {row.destinationCourseName}</p>
                        <p className="text-xs text-muted-foreground">ECTS {row.ects} · {row.semester} · rev {row.revision}</p>
                        {row.decisionRationale ? <p className="text-xs text-red-700">Prior rationale: {row.decisionRationale}</p> : null}
                        {row.status === 'IN_REVIEW' ? (
                          <div className="mt-2 flex gap-2">
                            <Button disabled={saving} onClick={() => decide(row.id, 'APPROVED')}>Approve</Button>
                            <Button disabled={saving} variant="destructive" onClick={() => decide(row.id, 'DENIED')}>Deny</Button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState title="Select an agreement" />
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
