'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { LoadingState } from '@/components/states/loading-state';
import { SuccessState } from '@/components/states/success-state';
import { EntityListButton, InstitutionalPageTemplate } from '@/components/institutional/page-template';

type QueueAgreement = {
  id: string;
  state: string;
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

export default function CoordinatorLearningAgreementPage() {
  const params = useSearchParams();
  const userId = params.get('userId') || 'coordinator-1';

  const [queue, setQueue] = useState<QueueAgreement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rationaleByRow, setRationaleByRow] = useState<Record<string, string>>({});
  const [gradeByRow, setGradeByRow] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingRow, setSavingRow] = useState<string | null>(null);
  const [reopenRationale, setReopenRationale] = useState('');
  const [reopening, setReopening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const response = await fetch(`/api/learning-agreements?role=coordinator&userId=${userId}`);
      const data = await response.json();
      if (!response.ok) setError(data.error || 'Failed to load queue');
      else { setQueue(data.queue || []); setSelectedId((prev) => prev ?? data.queue?.[0]?.id ?? null); }
    } catch { setError('Failed to load queue'); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [userId]);

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
    setSavingRow(rowId); setError(null); setSuccess(null);
    try {
      const response = await fetch(`/api/learning-agreements/${selected.id}/rows/${rowId}/decision`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, decision, rationale: rationaleByRow[rowId] || undefined, ...(rowId in gradeByRow ? { grade: gradeByRow[rowId] || null } : {}) })
      });
      const data = await response.json();
      if (!response.ok) setError(data.error || 'Decision failed');
      else { setSuccess(`Row ${decision === 'APPROVED' ? 'approved' : 'denied'}.`); setRationaleByRow((prev) => ({ ...prev, [rowId]: '' })); await load(); }
    } catch { setError('Decision failed'); } finally { setSavingRow(null); }
  }

  async function saveGrade(rowId: string) {
    if (!selected) return;
    setSavingRow(rowId); setError(null); setSuccess(null);
    try {
      const response = await fetch(`/api/learning-agreements/${selected.id}/rows/${rowId}/grade`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, grade: rowId in gradeByRow ? gradeByRow[rowId] || null : null })
      });
      const data = await response.json();
      if (!response.ok) setError(data.error || 'Grade update failed');
      else { setSuccess('Grade saved.'); await load(); }
    } catch { setError('Grade update failed'); } finally { setSavingRow(null); }
  }

  async function reopenSelected() {
    if (!selected) return;
    setReopening(true); setError(null); setSuccess(null);
    try {
      const response = await fetch(`/api/learning-agreements/${selected.id}/reopen`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, rationale: reopenRationale })
      });
      const data = await response.json();
      if (!response.ok) setError(data.error || 'Failed to reopen agreement');
      else { setSuccess('Agreement reopened for student revision.'); setReopenRationale(''); await load(); }
    } catch { setError('Failed to reopen agreement'); } finally { setReopening(false); }
  }

  return (
    <InstitutionalPageTemplate
      title="Learning Agreement Review"
      subtitle="Coordinator workspace for queue triage, row decisions, grading, and controlled reopening."
      contextSummary={<p className="text-sm">Queue size: <strong>{queue.length}</strong></p>}
      actionsBar={
        selected ? (
          <div className="grid gap-2 md:grid-cols-4 text-sm">
            <div className="rounded border bg-slate-50 p-2">Agreement: {selected.id}</div>
            <div className="rounded border bg-emerald-50 p-2">Approved: {stats.approved}</div>
            <div className="rounded border bg-rose-50 p-2">Denied: {stats.denied}</div>
            <div className="rounded border bg-amber-50 p-2">Pending: {stats.pending}</div>
          </div>
        ) : <EmptyState title="Select an agreement" />
      }
      primaryRegion={
        <div className="space-y-2 text-sm">
          {loading ? <LoadingState label="Loading learning agreement queue..." /> : null}
          {error ? <ErrorState message={error} /> : null}
          {success ? <SuccessState message={success} /> : null}
          {!loading && !queue.length ? <EmptyState title="No Learning Agreements in queue" /> : null}
          {queue.map((item) => (
            <EntityListButton key={item.id} selected={selectedId === item.id} onClick={() => setSelectedId(item.id)}>
              <div className="flex items-center justify-between"><p className="font-medium">{item.student.fullName}</p><Badge>{item.state}</Badge></div>
              <p className="text-xs text-muted-foreground">Mobility {item.mobilityRecord.id} · {item.mobilityRecord.destinationCity}</p>
            </EntityListButton>
          ))}
        </div>
      }
      activityRegion={
        selected ? (
          <div className="space-y-2 text-sm">
            {['ACCEPTED', 'PARTIALLY_APPROVED'].includes(selected.state) ? (
              <div className="space-y-2 rounded border border-amber-300 bg-amber-50 p-3">
                <Textarea value={reopenRationale} onChange={(event) => setReopenRationale(event.target.value)} placeholder="Reopen rationale (required)" />
                <Button disabled={reopening || !reopenRationale.trim()} variant="outline" onClick={reopenSelected}>Reopen agreement</Button>
              </div>
            ) : null}
            {selected.rows.map((row) => (
              <div key={row.id} className="rounded border p-3">
                <div className="flex items-center justify-between"><p className="font-medium">{row.homeCourseCode} → {row.destinationCourseCode}</p><Badge>{row.status.replace('_', ' ')}</Badge></div>
                <p>{row.homeCourseName} ⇄ {row.destinationCourseName}</p>
                <p className="text-xs text-muted-foreground">ECTS {row.ects} · {row.semester} · Revision {row.revision}</p>
                <div className="mt-2 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Input placeholder="Optional grade" value={gradeByRow[row.id] ?? row.grade ?? ''} onChange={(event) => setGradeByRow((prev) => ({ ...prev, [row.id]: event.target.value }))} />
                    <Button variant="outline" disabled={savingRow === row.id} onClick={() => saveGrade(row.id)}>Save grade</Button>
                  </div>
                  {row.status === 'IN_REVIEW' ? (
                    <>
                      <Textarea value={rationaleByRow[row.id] ?? ''} onChange={(event) => setRationaleByRow((prev) => ({ ...prev, [row.id]: event.target.value }))} placeholder="Rationale (required for deny)" />
                      <div className="flex gap-2">
                        <Button disabled={savingRow === row.id} onClick={() => decide(row.id, 'APPROVED')}>Approve row</Button>
                        <Button disabled={savingRow === row.id} variant="destructive" onClick={() => decide(row.id, 'DENIED')}>Deny row</Button>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : <EmptyState title="Select an agreement" hint="Choose a queue item to review rows." />
      }
    />
  );
}
