'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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

type SubmissionListItem = { id: string; state: string; updatedAt: string; student: { fullName: string }; procedureDefinition: { title: string } };
type SubmissionDetail = {
  id: string;
  state: string;
  rejectionRationale?: string | null;
  reopeningRationale?: string | null;
  student: { fullName: string; email: string };
  procedureDefinition: { title: string };
  events: { id: string; toState: string; rationale?: string | null; createdAt: string }[];
};

type AuditEvent = { id: string; actionType: string; createdAt: string; actor: { fullName: string } };
const ALL_STATES = ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'REOPENED', 'RESUBMITTED', 'ARCHIVED'];

export default function CoordinatorSubmissionHistoryPage() {
  const params = useSearchParams();
  const userId = params.get('userId') || 'coordinator-1';

  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [submissions, setSubmissions] = useState<SubmissionListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<SubmissionDetail | null>(null);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [rationale, setRationale] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filteredStates = useMemo(() => (stateFilter ? [stateFilter] : []), [stateFilter]);

  const loadList = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const searchParams = new URLSearchParams({ role: 'coordinator', userId, scope: 'history' });
      if (filteredStates.length) searchParams.set('states', filteredStates.join(','));
      if (query.trim()) searchParams.set('search', query.trim());
      const response = await fetch(`/api/submissions?${searchParams.toString()}`);
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'Failed to load submissions'); return; }
      const nextSubmissions = data.submissions || [];
      setSubmissions(nextSubmissions);
      setSelectedId((prev) => (prev && nextSubmissions.some((submission: SubmissionListItem) => submission.id === prev) ? prev : nextSubmissions[0]?.id ?? null));
    } catch { setError('Failed to load submissions'); } finally { setLoading(false); }
  }, [userId, filteredStates, query]);

  const loadDetail = useCallback(async (submissionId: string) => {
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/submissions/${submissionId}?role=coordinator&userId=${userId}`);
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'Failed to load submission details'); return; }
      setSelected(data.submission || null);
      setAudit(data.audit || []);
    } catch { setError('Failed to load submission details'); } finally { setDetailLoading(false); }
  }, [userId]);

  useEffect(() => { loadList(); }, [loadList]);
  useEffect(() => {
    if (!selectedId) { setSelected(null); setAudit([]); return; }
    loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  async function runAction(action: 'start_review' | 'approve' | 'reject' | 'reopen') {
    if (!selected) return;
    setSaving(true); setError(null); setSuccess(null);
    try {
      const response = await fetch(`/api/submissions/${selected.id}/transition`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, action, rationale: rationale || undefined }) });
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'Action failed'); return; }
      setRationale('');
      setSuccess(`Submission ${action.replace('_', ' ')} completed.`);
      await loadList();
      await loadDetail(selected.id);
    } catch { setError('Action failed'); } finally { setSaving(false); }
  }

  const canStartReview = selected?.state === 'SUBMITTED' || selected?.state === 'RESUBMITTED';
  const canApproveOrReject = selected?.state === 'IN_REVIEW';
  const canReopen = selected?.state === 'APPROVED' || selected?.state === 'REJECTED';

  return (
    <InstitutionalPageTemplate
      title="Coordinator Submission History"
      subtitle="Search institutional submissions and execute workflow transitions with traceability."
      contextSummary={<p className="text-sm">Records loaded: <strong>{submissions.length}</strong></p>}
      actionsBar={
        <div className="grid gap-2 md:grid-cols-3 text-sm">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by ID, student, procedure" />
          <Input value={stateFilter} onChange={(event) => setStateFilter(event.target.value.toUpperCase())} placeholder="Filter state" list="submission-states" />
          <Button variant="outline" onClick={loadList} disabled={loading}>Refresh</Button>
          <datalist id="submission-states">{ALL_STATES.map((state) => <option key={state} value={state} />)}</datalist>
        </div>
      }
      primaryRegion={
        <div className="space-y-2 text-sm">
          {loading ? <LoadingState label="Loading submissions..." /> : null}
          {error ? <ErrorState message={error} /> : null}
          {success ? <SuccessState message={success} /> : null}
          {!loading && !submissions.length ? <EmptyState title="No submissions found" /> : null}
          {submissions.map((item) => (
            <EntityListButton key={item.id} selected={selectedId === item.id} onClick={() => setSelectedId(item.id)}>
              <p className="font-medium">{item.student.fullName}</p>
              <p>{item.procedureDefinition.title}</p>
              <div className="mt-1 flex items-center justify-between"><Badge>{item.state}</Badge><span className="text-xs text-muted-foreground">{new Date(item.updatedAt).toLocaleString()}</span></div>
            </EntityListButton>
          ))}
        </div>
      }
      activityRegion={
        <div className="space-y-2 text-sm">
          {detailLoading ? <LoadingState label="Loading submission detail..." /> : null}
          {selected ? (
            <>
              <p className="font-mono text-xs text-muted-foreground">Submission: {selected.id}</p>
              <p><strong>Student:</strong> {selected.student.fullName} ({selected.student.email})</p>
              <p><strong>Procedure:</strong> {selected.procedureDefinition.title}</p>
              <p><strong>Current state:</strong> <Badge>{selected.state}</Badge></p>
              <Textarea value={rationale} onChange={(event) => setRationale(event.target.value)} placeholder="Required for reject/reopen" />
              <div className="grid grid-cols-2 gap-2">
                <Button disabled={saving || !canStartReview} variant="outline" onClick={() => runAction('start_review')}>Start Review</Button>
                <Button disabled={saving || !canApproveOrReject} onClick={() => runAction('approve')}>Approve</Button>
                <Button disabled={saving || !canApproveOrReject} variant="destructive" onClick={() => runAction('reject')}>Reject</Button>
                <Button disabled={saving || !canReopen} variant="outline" onClick={() => runAction('reopen')}>Reopen</Button>
              </div>
              <div className="space-y-1 rounded border p-2 text-xs">
                <p className="font-medium">Audit Trail</p>
                {!audit.length ? <p className="text-muted-foreground">No audit events yet.</p> : audit.map((event) => (
                  <p key={event.id}>{new Date(event.createdAt).toLocaleString()} · {event.actionType} by {event.actor.fullName}</p>
                ))}
              </div>
            </>
          ) : <EmptyState title="Select a submission" />}
        </div>
      }
    />
  );
}
