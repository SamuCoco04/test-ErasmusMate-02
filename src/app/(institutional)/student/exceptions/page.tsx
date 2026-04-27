'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ErrorState } from '@/components/states/error-state';
import { EmptyState } from '@/components/states/empty-state';
import { LoadingState } from '@/components/states/loading-state';
import { SuccessState } from '@/components/states/success-state';
import { EntityListButton, InstitutionalPageTemplate } from '@/components/institutional/page-template';
import type { StudentExceptionItem } from '@/modules/institutional/types';

const MOBILITY_ID = 'mobility-1';

export default function StudentExceptionsPage() {
  const params = useSearchParams();
  const userId = params.get('userId') || 'student-1';

  const [exceptions, setExceptions] = useState<StudentExceptionItem[]>([]);
  const [scopeRefId, setScopeRefId] = useState('deadline-1');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/exceptions?role=student&userId=${userId}`);
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || 'Failed to load exceptions');
        return;
      }

      setExceptions(payload.exceptions || []);
      setError(null);
    } catch {
      setError('Failed to load exceptions');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function submitException() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/exceptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, mobilityRecordId: MOBILITY_ID, scopeType: 'DEADLINE', scopeRefId, reason })
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || 'Failed to submit exception request');
        return;
      }

      setReason('');
      setSuccess('Exception request submitted to coordinator review.');
      await load();
    } catch {
      setError('Failed to submit exception request');
    } finally {
      setSaving(false);
    }
  }

  return (
    <InstitutionalPageTemplate
      title="Exception Request Workflow"
      subtitle="Request controlled policy exceptions and track coordinator decisions."
      contextSummary={<p className="text-sm">Workflow: WF-005 · Requests in history: <strong>{exceptions.length}</strong></p>}
      actionsBar={
        <div className="space-y-2 text-sm">
          <Input aria-label="Deadline reference id" value={scopeRefId} onChange={(e) => setScopeRefId(e.target.value)} placeholder="Deadline reference id" />
          <Textarea aria-label="Explain why this exception is needed" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain why this exception is needed" />
          <Button onClick={submitException} disabled={saving || reason.length < 10}>Submit exception</Button>
        </div>
      }
      primaryRegion={
        <div className="space-y-2">
          {loading ? <LoadingState label="Loading exceptions..." /> : null}
          {error ? <ErrorState message={error} /> : null}
          {success ? <SuccessState message={success} /> : null}
          {!loading && !error && !exceptions.length ? <EmptyState title="No exception requests yet" /> : null}
          {exceptions.map((item) => (
            <EntityListButton key={item.id}>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between"><p className="font-medium">{item.scopeType} exception</p><Badge>{item.state}</Badge></div>
                <p>{item.reason}</p>
                {item.decisionRationale ? <p className="text-xs text-muted-foreground">Decision rationale: {item.decisionRationale}</p> : null}
              </div>
            </EntityListButton>
          ))}
        </div>
      }
      activityRegion={<p className="text-xs text-muted-foreground">Recent decisions and rationale are embedded in each exception card.</p>}
    />
  );
}
