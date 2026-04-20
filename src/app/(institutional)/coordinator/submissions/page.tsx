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

type SubmissionListItem = {
  id: string;
  state: string;
  updatedAt: string;
  student: { fullName: string };
  procedureDefinition: { title: string };
};

type SubmissionDetail = {
  id: string;
  state: string;
  rejectionRationale?: string | null;
  reopeningRationale?: string | null;
  student: { fullName: string; email: string };
  procedureDefinition: { title: string };
  events: { id: string; toState: string; rationale?: string | null; createdAt: string }[];
};

type AuditEvent = {
  id: string;
  actionType: string;
  createdAt: string;
  actor: { fullName: string };
};

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

  const filteredStates = useMemo(() => (stateFilter ? [stateFilter] : []), [stateFilter]);

  async function loadList() {
    setLoading(true);
    setError(null);
    try {
      const searchParams = new URLSearchParams({ role: 'coordinator', userId, scope: 'history' });
      if (filteredStates.length) {
        searchParams.set('states', filteredStates.join(','));
      }
      if (query.trim()) {
        searchParams.set('search', query.trim());
      }

      const response = await fetch(`/api/submissions?${searchParams.toString()}`);
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to load submissions');
        return;
      }

      setSubmissions(data.submissions || []);
      setSelectedId((prev) => prev ?? data.submissions?.[0]?.id ?? null);
    } catch {
      setError('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(submissionId: string) {
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/submissions/${submissionId}?role=coordinator&userId=${userId}`);
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to load submission details');
        return;
      }

      setSelected(data.submission || null);
      setAudit(data.audit || []);
    } catch {
      setError('Failed to load submission details');
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, stateFilter]);

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      setAudit([]);
      return;
    }

    loadDetail(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, userId]);

  async function runAction(action: 'start_review' | 'approve' | 'reject' | 'reopen') {
    if (!selected) return;

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/submissions/${selected.id}/transition`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, rationale: rationale || undefined })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Action failed');
        return;
      }

      setRationale('');
      await loadList();
      await loadDetail(selected.id);
    } catch {
      setError('Action failed');
    } finally {
      setSaving(false);
    }
  }

  const canStartReview = selected?.state === 'SUBMITTED' || selected?.state === 'RESUBMITTED';
  const canApproveOrReject = selected?.state === 'IN_REVIEW';
  const canReopen = selected?.state === 'APPROVED' || selected?.state === 'REJECTED';

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Coordinator Submission History & Detail (Phase 3)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            Find institutional submissions beyond the active queue, inspect full transition/audit history, and reopen approved
            outcomes when policy/state allows.
          </p>
          <div className="grid gap-2 md:grid-cols-3">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by submission ID, student, procedure"
            />
            <Input
              value={stateFilter}
              onChange={(event) => setStateFilter(event.target.value.toUpperCase())}
              placeholder="Filter state (e.g. APPROVED)"
              list="submission-states"
            />
            <Button variant="outline" onClick={loadList} disabled={loading}>
              Refresh
            </Button>
            <datalist id="submission-states">
              {ALL_STATES.map((state) => (
                <option key={state} value={state} />
              ))}
            </datalist>
          </div>
        </CardContent>
      </Card>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}

      {!loading && !submissions.length ? (
        <EmptyState title="No submissions found" hint="Try removing filters or waiting for new workflow events." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Coordinator-accessible submissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {submissions.map((item) => (
                <button
                  key={item.id}
                  className={`w-full rounded border px-3 py-2 text-left ${selectedId === item.id ? 'border-blue-600' : ''}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <p className="font-medium">{item.student.fullName}</p>
                  <p>{item.procedureDefinition.title}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <Badge>{item.state}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(item.updatedAt).toLocaleString()}</span>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Submission detail & actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {detailLoading ? <LoadingState /> : null}
              {selected ? (
                <>
                  <p className="font-mono text-xs text-muted-foreground">Submission: {selected.id}</p>
                  <p>
                    <strong>Student:</strong> {selected.student.fullName} ({selected.student.email})
                  </p>
                  <p>
                    <strong>Procedure:</strong> {selected.procedureDefinition.title}
                  </p>
                  <p>
                    <strong>Current state:</strong> <Badge>{selected.state}</Badge>
                  </p>
                  {selected.rejectionRationale ? <p>Rejection rationale: {selected.rejectionRationale}</p> : null}
                  {selected.reopeningRationale ? <p>Reopen rationale: {selected.reopeningRationale}</p> : null}

                  <Textarea
                    value={rationale}
                    onChange={(event) => setRationale(event.target.value)}
                    placeholder="Required for reject/reopen"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <Button disabled={saving || !canStartReview} variant="outline" onClick={() => runAction('start_review')}>
                      Start Review
                    </Button>
                    <Button disabled={saving || !canApproveOrReject} onClick={() => runAction('approve')}>
                      Approve
                    </Button>
                    <Button
                      disabled={saving || !canApproveOrReject}
                      variant="destructive"
                      onClick={() => runAction('reject')}
                    >
                      Reject
                    </Button>
                    <Button disabled={saving || !canReopen} variant="outline" onClick={() => runAction('reopen')}>
                      Reopen
                    </Button>
                  </div>

                  {selected.events?.length ? (
                    <div className="rounded border bg-slate-50 p-2 text-xs">
                      <p className="mb-1 font-medium">Transition history</p>
                      <ul className="space-y-1">
                        {selected.events.map((event) => (
                          <li key={event.id}>
                            {new Date(event.createdAt).toLocaleString()} → {event.toState}
                            {event.rationale ? ` (${event.rationale})` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {audit.length ? (
                    <div className="rounded border bg-slate-50 p-2 text-xs">
                      <p className="mb-1 font-medium">Audit trail</p>
                      <ul className="space-y-1">
                        {audit.map((event) => (
                          <li key={event.id}>
                            {new Date(event.createdAt).toLocaleString()} · {event.actionType} by {event.actor.fullName}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              ) : (
                <EmptyState title="Select a submission" hint="Choose any item to inspect full institutional history." />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
