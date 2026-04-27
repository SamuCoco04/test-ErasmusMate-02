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
  const [success, setSuccess] = useState<string | null>(null);
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

  const actionables = useMemo(() => submissions.filter((s) => ['DRAFT', 'REJECTED', 'REOPENED'].includes(s.state)), [submissions]);

  async function createDraft() {
    if (!selectedProcedure) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, mobilityRecordId: MOBILITY_ID, procedureDefinitionId: selectedProcedure })
      });
      const data = await response.json();
      if (!response.ok) setError(data.error || 'Failed to create draft');
      else setSuccess('Draft created and added to your submission list.');
      await load();
    } catch {
      setError('Failed to create draft');
    } finally {
      setSaving(false);
    }
  }

  async function transition(submissionId: string, action: 'submit' | 'resubmit') {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/submissions/${submissionId}/transition`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, rationale: rationale || undefined })
      });
      const data = await response.json();
      if (!response.ok) setError(data.error || 'Transition failed');
      else setSuccess(action === 'submit' ? 'Submission sent to coordinator review.' : 'Submission resubmitted successfully.');
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
    <InstitutionalPageTemplate
      title="Student Submission Workflow"
      subtitle="Create procedure drafts and progress them through submission and resubmission states."
      contextSummary={
        <div className="grid gap-2 sm:grid-cols-3 text-sm">
          <div className="rounded border bg-slate-50 p-2">Total submissions: <strong>{submissions.length}</strong></div>
          <div className="rounded border bg-amber-50 p-2">Actionable now: <strong>{actionables.length}</strong></div>
          <div className="rounded border bg-slate-50 p-2">Workflow: <strong>WF-003</strong></div>
        </div>
      }
      actionsBar={
        <div className="space-y-2 text-sm">
          <div className="grid gap-2 md:grid-cols-[1fr_auto]">
            <Input
              value={selectedProcedure}
              onChange={(event) => setSelectedProcedure(event.target.value)}
              placeholder="Procedure ID"
              list="procedure-options"
            />
            <Button onClick={createDraft} disabled={saving || !selectedProcedure}>Create Draft</Button>
            <datalist id="procedure-options">
              {procedures.map((procedure) => (
                <option key={procedure.id} value={procedure.id}>{procedure.title}</option>
              ))}
            </datalist>
          </div>
          <Textarea value={rationale} onChange={(event) => setRationale(event.target.value)} placeholder="Optional rationale for resubmit" />
        </div>
      }
      primaryRegion={
        <div className="space-y-3 text-sm">
          {loading ? <LoadingState label="Loading submissions..." /> : null}
          {error ? <ErrorState message={error} /> : null}
          {success ? <SuccessState message={success} /> : null}
          {!loading && !submissions.length ? <EmptyState title="No submissions yet" hint="Create your first draft above." /> : null}

          {submissions.map((submission) => (
            <EntityListButton key={submission.id}>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{submission.procedureDefinition.title}</p>
                  <Badge>{submission.state}</Badge>
                </div>
                <p className="font-mono text-xs text-muted-foreground">ID: {submission.id}</p>
                {submission.rejectionRationale ? <p className="text-xs">Rejection: {submission.rejectionRationale}</p> : null}
                {submission.reopeningRationale ? <p className="text-xs">Reopen note: {submission.reopeningRationale}</p> : null}
                <div className="flex flex-wrap gap-2">
                  {submission.state === 'DRAFT' ? <Button disabled={saving} onClick={() => transition(submission.id, 'submit')}>Submit</Button> : null}
                  {['REJECTED', 'REOPENED'].includes(submission.state) ? (
                    <Button disabled={saving} onClick={() => transition(submission.id, 'resubmit')}>Resubmit</Button>
                  ) : null}
                </div>
              </div>
            </EntityListButton>
          ))}
        </div>
      }
      activityRegion={
        <div className="space-y-2 text-xs text-muted-foreground">
          {!audit.length ? <EmptyState title="No recent audit events" hint="Actions performed in this session appear here." /> : null}
          {audit.map((item) => (
            <p key={item.id}>{new Date(item.createdAt).toLocaleString()} · {item.actionType}</p>
          ))}
        </div>
      }
    />
  );
}
