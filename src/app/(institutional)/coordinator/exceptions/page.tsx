'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { LoadingState } from '@/components/states/loading-state';
import { SuccessState } from '@/components/states/success-state';
import { EntityListButton, InstitutionalPageTemplate } from '@/components/institutional/page-template';
import type { CoordinatorExceptionItem } from '@/modules/institutional/types';

export default function CoordinatorExceptionsPage() {
  const params = useSearchParams();
  const userId = params.get('userId') || 'coordinator-1';

  const [exceptions, setExceptions] = useState<CoordinatorExceptionItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rationale, setRationale] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/exceptions?role=coordinator&userId=${userId}`);
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || 'Failed to load exception queue');
        return;
      }
      const nextExceptions = payload.exceptions || [];
      setExceptions(nextExceptions);
      setSelectedId((prev) => (prev && nextExceptions.some((item: CoordinatorExceptionItem) => item.id === prev) ? prev : nextExceptions[0]?.id ?? null));
      setError(null);
    } catch {
      setError('Failed to load exception queue');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const selected = useMemo(() => exceptions.find((item) => item.id === selectedId) || null, [exceptions, selectedId]);

  async function action(actionName: 'start_review' | 'approve' | 'reject' | 'apply' | 'close') {
    if (!selected) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/exceptions/${selected.id}/decision`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: actionName, rationale: rationale || undefined })
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || 'Failed to apply exception action');
        return;
      }
      setRationale('');
      setSuccess(`Action ${actionName.replace('_', ' ')} completed.`);
      await load();
    } catch {
      setError('Failed to apply exception action');
    } finally {
      setSaving(false);
    }
  }

  return (
    <InstitutionalPageTemplate
      title="Exception Review & Decision"
      subtitle="Coordinator queue for reviewing, approving, rejecting, applying, and closing exceptions."
      contextSummary={<p className="text-sm">Queue items: <strong>{exceptions.length}</strong> · Workflow: WF-005</p>}
      actionsBar={
        <div className="space-y-2 text-sm">
          <Textarea aria-label="Decision rationale" value={rationale} onChange={(event) => setRationale(event.target.value)} placeholder="Decision rationale (required for rejection)" />
          <div className="grid grid-cols-2 gap-2">
            <Button disabled={saving || !selected} variant="outline" onClick={() => action('start_review')}>Start review</Button>
            <Button disabled={saving || !selected} onClick={() => action('approve')}>Approve</Button>
            <Button disabled={saving || !selected} variant="destructive" onClick={() => action('reject')}>Reject</Button>
            <Button disabled={saving || !selected} variant="outline" onClick={() => action('apply')}>Apply</Button>
            <Button disabled={saving || !selected} variant="outline" className="col-span-2" onClick={() => action('close')}>Close</Button>
          </div>
        </div>
      }
      primaryRegion={
        <div className="space-y-2 text-sm">
          {loading ? <LoadingState label="Loading exception queue..." /> : null}
          {error ? <ErrorState message={error} /> : null}
          {success ? <SuccessState message={success} /> : null}
          {!loading && !error && !exceptions.length ? <EmptyState title="Exception queue empty" /> : null}
          {exceptions.map((item) => (
            <EntityListButton key={item.id} selected={selectedId === item.id} onClick={() => setSelectedId(item.id)}>
              <div className="space-y-1">
                <div className="flex items-center justify-between"><p className="font-medium">{item.student.fullName}</p><Badge>{item.state}</Badge></div>
                <p>{item.scopeType}</p>
              </div>
            </EntityListButton>
          ))}
        </div>
      }
      activityRegion={selected ? <p className="text-sm">Selected reason: {selected.reason}</p> : <EmptyState title="Select an exception" />}
    />
  );
}
