'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { LoadingState } from '@/components/states/loading-state';

type QueueAgreement = {
  id: string;
  state: string;
  submittedAt?: string | null;
  student: { fullName: string };
  mobilityRecord: { id: string; destinationCity: string };
  rows: {
    id: string;
    status: 'IN_REVIEW' | 'APPROVED' | 'DENIED';
    revision: number;
    homeCourseCode: string;
    homeCourseName: string;
    destinationCourseCode: string;
    destinationCourseName: string;
    semester: string;
    ects: number;
    grade?: string | null;
    decisionRationale?: string | null;
  }[];
};

const statusTone = {
  IN_REVIEW: 'border-amber-200 bg-amber-50 text-amber-800',
  APPROVED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  DENIED: 'border-rose-200 bg-rose-50 text-rose-800'
} as const;

export default function CoordinatorLearningAgreementPage() {
  const params = useSearchParams();
  const userId = params.get('userId') || 'coordinator-1';

  const [queue, setQueue] = useState<QueueAgreement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rationaleByRow, setRationaleByRow] = useState<Record<string, string>>({});
  const [gradeByRow, setGradeByRow] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingRow, setSavingRow] = useState<string | null>(null);
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
    setSavingRow(rowId);
    setError(null);
    try {
      const response = await fetch(`/api/learning-agreements/${selected.id}/rows/${rowId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          decision,
          rationale: rationaleByRow[rowId] || undefined,
          grade: gradeByRow[rowId] || null
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Decision failed');
      } else {
        setRationaleByRow((prev) => ({ ...prev, [rowId]: '' }));
        await load();
      }
    } catch {
      setError('Decision failed');
    } finally {
      setSavingRow(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Learning Agreement Review</CardTitle>
          <p className="text-sm text-muted-foreground">
            Institutional review workspace with queue visibility, row-level decisions, denial rationale, and optional grade entry.
          </p>
        </CardHeader>
      </Card>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && !queue.length ? <EmptyState title="No Learning Agreements in queue" hint="Submitted agreements assigned to you will appear here." /> : null}

      {queue.length ? (
        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assigned Queue ({queue.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {queue.map((item) => {
                const pending = item.rows.filter((row) => row.status === 'IN_REVIEW').length;
                const denied = item.rows.filter((row) => row.status === 'DENIED').length;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full rounded border p-3 text-left transition ${selectedId === item.id ? 'border-blue-600 bg-blue-50' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{item.student.fullName}</p>
                      <Badge>{item.state}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Mobility {item.mobilityRecord.id} · {item.mobilityRecord.destinationCity}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Pending {pending} · Denied {denied} · Total {item.rows.length}</p>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Agreement Detail Workspace</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {selected ? (
                <>
                  <div className="grid gap-2 md:grid-cols-4">
                    <div className="rounded border bg-slate-50 p-2 text-xs">Agreement: {selected.id}</div>
                    <div className="rounded border bg-emerald-50 p-2 text-xs">Approved: {stats.approved}</div>
                    <div className="rounded border bg-rose-50 p-2 text-xs">Denied: {stats.denied}</div>
                    <div className="rounded border bg-amber-50 p-2 text-xs">Pending: {stats.pending}</div>
                  </div>

                  <div className="space-y-2">
                    {selected.rows.map((row) => (
                      <div key={row.id} className="rounded border p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium">{row.homeCourseCode} → {row.destinationCourseCode}</p>
                          <Badge className={statusTone[row.status]}>{row.status.replace('_', ' ')}</Badge>
                        </div>
                        <p>{row.homeCourseName} ⇄ {row.destinationCourseName}</p>
                        <p className="text-xs text-muted-foreground">ECTS {row.ects} · {row.semester} · Revision {row.revision}</p>
                        <p className="text-xs text-muted-foreground">Current grade: {row.grade || 'Not set'}</p>
                        {row.decisionRationale ? (
                          <p className="mt-1 rounded border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">Previous rationale: {row.decisionRationale}</p>
                        ) : null}

                        {row.status === 'IN_REVIEW' ? (
                          <div className="mt-2 space-y-2">
                            <Input
                              placeholder="Optional grade update (coordinator only)"
                              value={gradeByRow[row.id] ?? row.grade ?? ''}
                              onChange={(event) => setGradeByRow((prev) => ({ ...prev, [row.id]: event.target.value }))}
                            />
                            <Textarea
                              value={rationaleByRow[row.id] ?? ''}
                              onChange={(event) => setRationaleByRow((prev) => ({ ...prev, [row.id]: event.target.value }))}
                              placeholder="Rationale (required for deny)"
                            />
                            <div className="flex flex-wrap gap-2">
                              <Button disabled={savingRow === row.id} onClick={() => decide(row.id, 'APPROVED')}>Approve row</Button>
                              <Button disabled={savingRow === row.id} variant="destructive" onClick={() => decide(row.id, 'DENIED')}>Deny row</Button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState title="Select an agreement" hint="Choose an agreement from the queue to review row-level decisions." />
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
