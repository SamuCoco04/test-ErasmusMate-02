'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { LoadingState } from '@/components/states/loading-state';
import type { ExceptionItem } from '@/modules/institutional/types';

export default function CoordinatorExceptionsPage() {
  const params = useSearchParams();
  const userId = params.get('userId') || 'coordinator-1';

  const [exceptions, setExceptions] = useState<ExceptionItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rationale, setRationale] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/exceptions?role=coordinator&userId=${userId}`);
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || 'Failed to load exception queue');
        return;
      }
      setExceptions(payload.exceptions || []);
      setSelectedId((prev) => prev ?? payload.exceptions?.[0]?.id ?? null);
      setError(null);
    } catch {
      setError('Failed to load exception queue');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const selected = useMemo(() => exceptions.find((item) => item.id === selectedId) || null, [exceptions, selectedId]);

  async function action(actionName: 'start_review' | 'approve' | 'reject' | 'apply' | 'close') {
    if (!selected) return;

    setSaving(true);
    setError(null);

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
      await load();
    } catch {
      setError('Failed to apply exception action');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Exception review & decision (WF-005)</CardTitle>
        </CardHeader>
      </Card>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}

      {!loading && !error && !exceptions.length ? (
        <EmptyState title="Exception queue empty" hint="Submitted exception requests will appear here for review." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {exceptions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selectedId === item.id}
                  className={`w-full rounded border px-3 py-2 text-left ${selectedId === item.id ? 'border-blue-600' : ''}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <p className="font-medium">{item.student.fullName}</p>
                  <p>{item.scopeType}</p>
                  <Badge className="mt-1">{item.state}</Badge>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Decision panel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {selected ? (
                <>
                  <p>{selected.reason}</p>
                  <Textarea
                    aria-label="Decision rationale"
                    value={rationale}
                    onChange={(event) => setRationale(event.target.value)}
                    placeholder="Rationale (required for rejection)"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Button disabled={saving} variant="outline" onClick={() => action('start_review')}>Start review</Button>
                    <Button disabled={saving} onClick={() => action('approve')}>Approve</Button>
                    <Button disabled={saving} variant="destructive" onClick={() => action('reject')}>Reject</Button>
                    <Button disabled={saving} variant="outline" onClick={() => action('apply')}>Apply</Button>
                    <Button disabled={saving} variant="outline" className="col-span-2" onClick={() => action('close')}>Close</Button>
                  </div>
                </>
              ) : (
                <EmptyState title="Select an exception" hint="Choose an item from the queue to review it." />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
