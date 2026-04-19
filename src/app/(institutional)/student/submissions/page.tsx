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

type Submission = {
  id: string;
  state: string;
  rejectionRationale?: string | null;
  reopeningRationale?: string | null;
  procedureDefinition: { id: string; title: string };
  events: { id: string; toState: string; rationale?: string | null; createdAt: string }[];
};

type Procedure = { id: string; title: string };

const MOBILITY_ID = 'mobility-1';

export default function StudentSubmissionsPage() {
  const params = useSearchParams();
  const userId = params.get('userId') || 'student-1';

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [selectedProcedure, setSelectedProcedure] = useState('');
  const [rationale, setRationale] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audit, setAudit] = useState<{ id: string; actionType: string; createdAt: string }[]>([]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/submissions?role=student&userId=${userId}&mobilityRecordId=${MOBILITY_ID}`);
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to load submissions');
        return;
      }

      setSubmissions(data.submissions || []);
      setProcedures(data.procedures || []);
      if (!selectedProcedure && data.procedures?.[0]) {
        setSelectedProcedure(data.procedures[0].id);
      }
    } catch {
      setError('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const actionables = useMemo(
    () => submissions.filter((s) => ['DRAFT', 'REJECTED', 'REOPENED'].includes(s.state)),
    [submissions]
  );

  async function createDraft() {
    if (!selectedProcedure) return;
    setSaving(true);
    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, mobilityRecordId: MOBILITY_ID, procedureDefinitionId: selectedProcedure })
      });
      const data = await response.json();
      if (!response.ok) setError(data.error || 'Failed to create draft');
      await load();
    } catch {
      setError('Failed to create draft');
    } finally {
      setSaving(false);
    }
  }

  async function transition(submissionId: string, action: 'submit' | 'resubmit') {
    setSaving(true);
    try {
      const response = await fetch(`/api/submissions/${submissionId}/transition`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, rationale: rationale || undefined })
      });
      const data = await response.json();
      if (!response.ok) setError(data.error || 'Transition failed');
      setAudit(data.audit || []);
      setRationale('');
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
          <CardTitle>Student Submission Workflow (WF-003)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>Create drafts, submit, and resubmit after rejection/reopen.</p>
          <div className="grid gap-2 md:grid-cols-[1fr_auto]">
            <Input
              value={selectedProcedure}
              onChange={(event) => setSelectedProcedure(event.target.value)}
              placeholder="Procedure ID"
              list="procedure-options"
            />
            <Button onClick={createDraft} disabled={saving || !selectedProcedure}>
              Create Draft
            </Button>
            <datalist id="procedure-options">
              {procedures.map((procedure) => (
                <option key={procedure.id} value={procedure.id}>
                  {procedure.title}
                </option>
              ))}
            </datalist>
          </div>
          <Textarea
            value={rationale}
            onChange={(event) => setRationale(event.target.value)}
            placeholder="Optional rationale (used for resubmit note)"
          />
        </CardContent>
      </Card>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}

      {!loading && !submissions.length ? <EmptyState title="No submissions yet" hint="Create your first draft above." /> : null}

      {audit.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Latest audit events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            {audit.map((item) => (
              <p key={item.id}>
                {new Date(item.createdAt).toLocaleString()} · {item.actionType}
              </p>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-3">
        {submissions.map((submission) => (
          <Card key={submission.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>{submission.procedureDefinition.title}</span>
                <Badge>{submission.state}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-mono text-xs text-muted-foreground">ID: {submission.id}</p>
              {submission.rejectionRationale ? <p>Rejection rationale: {submission.rejectionRationale}</p> : null}
              {submission.reopeningRationale ? <p>Reopening rationale: {submission.reopeningRationale}</p> : null}

              <div className="flex gap-2">
                {submission.state === 'DRAFT' ? (
                  <Button disabled={saving} onClick={() => transition(submission.id, 'submit')}>
                    Submit
                  </Button>
                ) : null}
                {['REJECTED', 'REOPENED'].includes(submission.state) ? (
                  <Button disabled={saving} onClick={() => transition(submission.id, 'resubmit')}>
                    Resubmit
                  </Button>
                ) : null}
              </div>

              {submission.events?.length ? (
                <div className="rounded border bg-slate-50 p-2 text-xs">
                  <p className="mb-1 font-medium">Recent transitions</p>
                  <ul className="space-y-1">
                    {submission.events.map((event) => (
                      <li key={event.id}>
                        {new Date(event.createdAt).toLocaleString()} → {event.toState}
                        {event.rationale ? ` (${event.rationale})` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && actionables.length === 0 ? (
        <EmptyState title="No actionable items" hint="Wait for coordinator decisions or create a new draft." />
      ) : null}
    </div>
  );
}
