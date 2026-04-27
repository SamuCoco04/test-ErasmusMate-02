'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { LoadingState } from '@/components/states/loading-state';
import { SuccessState } from '@/components/states/success-state';
import { InstitutionalPageTemplate } from '@/components/institutional/page-template';

const MOBILITY_ID = 'mobility-1';

type Row = {
  id: string;
  revision: number;
  status: 'IN_REVIEW' | 'APPROVED' | 'DENIED';
  decisionRationale?: string | null;
  homeCourseCode: string;
  homeCourseName: string;
  destinationCourseCode: string;
  destinationCourseName: string;
  ects: number;
  semester: string;
  grade?: string | null;
};

type Agreement = {
  id: string;
  state: string;
  rows: Row[];
  events: { id: string; actionType: string; createdAt: string; noteOrRationale?: string | null; actor: { fullName: string } }[];
  permissions: { canEdit: boolean; canSubmit: boolean; canResubmit: boolean };
};

type Filter = 'ALL' | 'DENIED' | 'IN_REVIEW' | 'APPROVED';

const emptyRow = { homeCourseCode: '', homeCourseName: '', destinationCourseCode: '', destinationCourseName: '', ects: '6', semester: 'Semester 1' };

export default function StudentLearningAgreementPage() {
  const params = useSearchParams();
  const userId = params.get('userId') || 'student-1';

  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [form, setForm] = useState(emptyRow);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function ensureAgreement() {
    const response = await fetch('/api/learning-agreements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, mobilityRecordId: MOBILITY_ID }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to initialize learning agreement');
    return data.agreement.id as string;
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const agreementId = await ensureAgreement();
      const response = await fetch(`/api/learning-agreements/${agreementId}?userId=${userId}`);
      const data = await response.json();
      if (!response.ok) setError(data.error || 'Failed to load agreement');
      else setAgreement(data.agreement);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load agreement');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const visibleRows = useMemo(() => {
    if (!agreement) return [];
    if (filter === 'ALL') return agreement.rows;
    return agreement.rows.filter((row) => row.status === filter);
  }, [agreement, filter]);

  const stats = useMemo(() => {
    const rows = agreement?.rows ?? [];
    return {
      denied: rows.filter((row) => row.status === 'DENIED').length,
      approved: rows.filter((row) => row.status === 'APPROVED').length,
      inReview: rows.filter((row) => row.status === 'IN_REVIEW').length,
      total: rows.length
    };
  }, [agreement]);

  function beginEdit(row: Row) {
    setEditingId(row.id);
    setSuccess(null);
    setForm({
      homeCourseCode: row.homeCourseCode,
      homeCourseName: row.homeCourseName,
      destinationCourseCode: row.destinationCourseCode,
      destinationCourseName: row.destinationCourseName,
      ects: String(row.ects),
      semester: row.semester
    });
  }

  function resetForm() { setEditingId(null); setForm(emptyRow); }

  async function saveRow() {
    if (!agreement) return;
    setSaving(true); setError(null); setSuccess(null);
    const payload = { userId, row: { ...form, ects: Number(form.ects) } };
    try {
      const response = await fetch(editingId ? `/api/learning-agreements/${agreement.id}/rows/${editingId}` : `/api/learning-agreements/${agreement.id}/rows`, {
        method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) setError(data.error || 'Failed to save row');
      else { setSuccess(editingId ? 'Row revision saved for review.' : 'New equivalence row added.'); resetForm(); await load(); }
    } catch { setError('Failed to save row'); } finally { setSaving(false); }
  }

  async function removeRow(rowId: string) {
    if (!agreement) return;
    setSaving(true); setSuccess(null);
    try {
      const response = await fetch(`/api/learning-agreements/${agreement.id}/rows/${rowId}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) });
      const data = await response.json();
      if (!response.ok) setError(data.error || 'Failed to remove row');
      else { setSuccess('Draft row removed.'); await load(); }
    } catch { setError('Failed to remove row'); } finally { setSaving(false); }
  }

  async function transition(action: 'submit' | 'resubmit') {
    if (!agreement) return;
    setSaving(true); setError(null); setSuccess(null);
    try {
      const response = await fetch(`/api/learning-agreements/${agreement.id}/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) });
      const data = await response.json();
      if (!response.ok) setError(data.error || 'Transition failed');
      else setSuccess(action === 'submit' ? 'Agreement submitted for coordinator review.' : 'Revised rows resubmitted successfully.');
      await load();
    } catch { setError('Transition failed'); } finally { setSaving(false); }
  }

  return (
    <InstitutionalPageTemplate
      title="My Learning Agreement"
      subtitle="Build course equivalences, track row-level decisions, and resubmit denied items."
      contextSummary={
        <div className="grid gap-2 sm:grid-cols-4 text-sm">
          <div className="rounded border bg-slate-50 p-2">Rows: <strong>{stats.total}</strong></div>
          <div className="rounded border bg-emerald-50 p-2">Approved: <strong>{stats.approved}</strong></div>
          <div className="rounded border bg-amber-50 p-2">In review: <strong>{stats.inReview}</strong></div>
          <div className="rounded border bg-rose-50 p-2">Denied: <strong>{stats.denied}</strong></div>
        </div>
      }
      actionsBar={
        <div className="space-y-3 text-sm">
          {agreement?.permissions.canSubmit ? <Button disabled={saving} onClick={() => transition('submit')}>Submit for Review</Button> : null}
          {agreement?.permissions.canResubmit ? <Button disabled={saving} onClick={() => transition('resubmit')}>Resubmit Revised Rows</Button> : null}
          {agreement?.permissions.canEdit ? (
            <div className="grid gap-2 md:grid-cols-2">
              <Input placeholder="Home course code" value={form.homeCourseCode} onChange={(e) => setForm((p) => ({ ...p, homeCourseCode: e.target.value }))} />
              <Input placeholder="Home course name" value={form.homeCourseName} onChange={(e) => setForm((p) => ({ ...p, homeCourseName: e.target.value }))} />
              <Input placeholder="Destination course code" value={form.destinationCourseCode} onChange={(e) => setForm((p) => ({ ...p, destinationCourseCode: e.target.value }))} />
              <Input placeholder="Destination course name" value={form.destinationCourseName} onChange={(e) => setForm((p) => ({ ...p, destinationCourseName: e.target.value }))} />
              <Input placeholder="ECTS" value={form.ects} onChange={(e) => setForm((p) => ({ ...p, ects: e.target.value }))} />
              <Input placeholder="Semester" value={form.semester} onChange={(e) => setForm((p) => ({ ...p, semester: e.target.value }))} />
              <div className="md:col-span-2 flex gap-2">
                <Button disabled={saving} onClick={saveRow}>{editingId ? 'Save Revision' : 'Add Row'}</Button>
                {editingId ? <Button variant="outline" onClick={resetForm}>Cancel</Button> : null}
              </div>
            </div>
          ) : null}
        </div>
      }
      primaryRegion={
        <div className="space-y-3 text-sm">
          {loading ? <LoadingState label="Loading learning agreement..." /> : null}
          {error ? <ErrorState message={error} /> : null}
          {success ? <SuccessState message={success} /> : null}
          <div className="flex flex-wrap gap-2">
            {(['ALL', 'DENIED', 'IN_REVIEW', 'APPROVED'] as Filter[]).map((value) => (
              <Button key={value} variant={filter === value ? 'default' : 'outline'} onClick={() => setFilter(value)}>{value}</Button>
            ))}
          </div>
          {!loading && agreement != null && !agreement.rows.length ? <EmptyState title="No rows yet" hint="Add your first equivalence row." /> : null}
          {!loading && agreement != null && agreement.rows.length > 0 && !visibleRows.length ? <EmptyState title="No rows in this filter" /> : null}
          <div className="space-y-2">
            {visibleRows.map((row) => (
              <div key={row.id} className="rounded border p-3">
                <div className="flex items-center justify-between"><p className="font-medium">{row.homeCourseCode} → {row.destinationCourseCode}</p><Badge>{row.status.replace('_', ' ')}</Badge></div>
                <p>{row.homeCourseName} ⇄ {row.destinationCourseName}</p>
                <p className="text-xs text-muted-foreground">ECTS {row.ects} · {row.semester} · Revision {row.revision}</p>
                {row.status === 'DENIED' ? <p className="mt-1 text-xs text-rose-700">Coordinator rationale: {row.decisionRationale || 'No rationale captured.'}</p> : null}
                {agreement?.permissions.canEdit ? (
                  <div className="mt-2 flex gap-2">
                    <Button variant="outline" disabled={saving} onClick={() => beginEdit(row)}>Revise row</Button>
                    {agreement.state === 'DRAFT' ? <Button variant="destructive" disabled={saving} onClick={() => removeRow(row.id)}>Remove</Button> : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      }
      activityRegion={
        <div className="space-y-2 text-xs text-muted-foreground">
          {!loading && agreement != null && !agreement.events.length ? <EmptyState title="No workflow activity yet" /> : null}
          {!loading && agreement != null ? agreement.events.slice(0, 8).map((event) => (
            <div key={event.id} className="rounded border p-2">
              <p className="font-medium text-slate-700">{event.actionType.replaceAll('_', ' ')}</p>
              <p>{new Date(event.createdAt).toLocaleString()} · {event.actor.fullName}</p>
              {event.noteOrRationale ? <p>{event.noteOrRationale}</p> : null}
            </div>
          )) : null}
        </div>
      }
    />
  );
}
