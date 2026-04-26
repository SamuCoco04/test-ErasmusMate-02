'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { LoadingState } from '@/components/states/loading-state';

const MOBILITY_ID = 'mobility-1';

type Row = {
  id: string;
  rowKey: string;
  revision: number;
  status: string;
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

const emptyRow = {
  homeCourseCode: '',
  homeCourseName: '',
  destinationCourseCode: '',
  destinationCourseName: '',
  ects: '6',
  semester: 'Semester 1',
  grade: ''
};

export default function StudentLearningAgreementPage() {
  const params = useSearchParams();
  const userId = params.get('userId') || 'student-1';

  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [form, setForm] = useState(emptyRow);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ensureAgreement() {
    const response = await fetch('/api/learning-agreements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, mobilityRecordId: MOBILITY_ID })
    });
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
      if (!response.ok) {
        setError(data.error || 'Failed to load agreement');
      } else {
        setAgreement(data.agreement);
      }
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

  const deniedLatest = useMemo(() => agreement?.rows.filter((row) => row.status === 'DENIED') || [], [agreement]);

  function beginEdit(row: Row) {
    setEditingId(row.id);
    setForm({
      homeCourseCode: row.homeCourseCode,
      homeCourseName: row.homeCourseName,
      destinationCourseCode: row.destinationCourseCode,
      destinationCourseName: row.destinationCourseName,
      ects: String(row.ects),
      semester: row.semester,
      grade: row.grade || ''
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyRow);
  }

  async function saveRow() {
    if (!agreement) return;
    setSaving(true);
    setError(null);
    const payload = {
      userId,
      row: {
        homeCourseCode: form.homeCourseCode,
        homeCourseName: form.homeCourseName,
        destinationCourseCode: form.destinationCourseCode,
        destinationCourseName: form.destinationCourseName,
        ects: Number(form.ects),
        semester: form.semester,
        grade: form.grade || null
      }
    };

    try {
      const response = await fetch(
        editingId
          ? `/api/learning-agreements/${agreement.id}/rows/${editingId}`
          : `/api/learning-agreements/${agreement.id}/rows`,
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to save row');
      } else {
        resetForm();
        await load();
      }
    } catch {
      setError('Failed to save row');
    } finally {
      setSaving(false);
    }
  }

  async function removeRow(rowId: string) {
    if (!agreement) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/learning-agreements/${agreement.id}/rows/${rowId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to remove row');
      } else {
        await load();
      }
    } catch {
      setError('Failed to remove row');
    } finally {
      setSaving(false);
    }
  }

  async function transition(action: 'submit' | 'resubmit') {
    if (!agreement) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/learning-agreements/${agreement.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await response.json();
      if (!response.ok) setError(data.error || 'Transition failed');
      await load();
    } catch {
      setError('Transition failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>My Learning Agreement (Course Equivalences)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Structured academic-equivalence workflow with row-level coordinator decisions and safe revisions.
        </CardContent>
      </Card>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}

      {agreement ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>Agreement Status</span>
                <Badge>{agreement.state}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {deniedLatest.length ? (
                <p className="rounded border border-red-300 bg-red-50 p-2 text-red-700">
                  {deniedLatest.length} denied row(s) still require revision before resubmission.
                </p>
              ) : null}
              <div className="flex gap-2">
                {agreement.permissions.canSubmit ? (
                  <Button disabled={saving} onClick={() => transition('submit')}>
                    Submit for Review
                  </Button>
                ) : null}
                {agreement.permissions.canResubmit ? (
                  <Button disabled={saving} onClick={() => transition('resubmit')}>
                    Resubmit Revised Rows
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {agreement.permissions.canEdit ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{editingId ? 'Edit Row Revision' : 'Add New Equivalence Row'}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 md:grid-cols-2">
                <Input placeholder="Home course code" value={form.homeCourseCode} onChange={(e) => setForm((p) => ({ ...p, homeCourseCode: e.target.value }))} />
                <Input placeholder="Home course name" value={form.homeCourseName} onChange={(e) => setForm((p) => ({ ...p, homeCourseName: e.target.value }))} />
                <Input placeholder="Destination course code" value={form.destinationCourseCode} onChange={(e) => setForm((p) => ({ ...p, destinationCourseCode: e.target.value }))} />
                <Input placeholder="Destination course name" value={form.destinationCourseName} onChange={(e) => setForm((p) => ({ ...p, destinationCourseName: e.target.value }))} />
                <Input placeholder="ECTS" value={form.ects} onChange={(e) => setForm((p) => ({ ...p, ects: e.target.value }))} />
                <Input placeholder="Semester" value={form.semester} onChange={(e) => setForm((p) => ({ ...p, semester: e.target.value }))} />
                <Input className="md:col-span-2" placeholder="Optional grade" value={form.grade} onChange={(e) => setForm((p) => ({ ...p, grade: e.target.value }))} />
                <div className="md:col-span-2 flex gap-2">
                  <Button disabled={saving} onClick={saveRow}>{editingId ? 'Save Revision' : 'Add Row'}</Button>
                  {editingId ? (
                    <Button variant="outline" onClick={resetForm}>Cancel</Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Latest Row Revisions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {!agreement.rows.length ? <EmptyState title="No rows yet" hint="Add your first course equivalence row." /> : null}
              {agreement.rows.map((row) => (
                <div key={row.id} className="rounded border p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="font-medium">{row.homeCourseCode} → {row.destinationCourseCode}</p>
                    <Badge>{row.status}</Badge>
                  </div>
                  <p>{row.homeCourseName} ⇄ {row.destinationCourseName}</p>
                  <p className="text-xs text-muted-foreground">ECTS: {row.ects} · Semester: {row.semester} · Revision {row.revision}</p>
                  {row.decisionRationale ? <p className="mt-1 text-xs text-red-700">Coordinator rationale: {row.decisionRationale}</p> : null}
                  {agreement.permissions.canEdit ? (
                    <div className="mt-2 flex gap-2">
                      <Button variant="outline" onClick={() => beginEdit(row)}>Edit</Button>
                      {agreement.state === 'DRAFT' ? (
                        <Button variant="destructive" onClick={() => removeRow(row.id)}>Remove</Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Workflow Event History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs">
              {agreement.events.map((event) => (
                <p key={event.id}>{new Date(event.createdAt).toLocaleString()} · {event.actor.fullName} · {event.actionType}{event.noteOrRationale ? ` (${event.noteOrRationale})` : ''}</p>
              ))}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
