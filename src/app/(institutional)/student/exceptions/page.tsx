'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ErrorState } from '@/components/states/error-state';
import { EmptyState } from '@/components/states/empty-state';
import { LoadingState } from '@/components/states/loading-state';
import type { ExceptionItem } from '@/modules/institutional/types';

const MOBILITY_ID = 'mobility-1';

export default function StudentExceptionsPage() {
  const params = useSearchParams();
  const userId = params.get('userId') || 'student-1';

  const [exceptions, setExceptions] = useState<ExceptionItem[]>([]);
  const [scopeRefId, setScopeRefId] = useState('deadline-1');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
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

    try {
      const response = await fetch('/api/exceptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          mobilityRecordId: MOBILITY_ID,
          scopeType: 'DEADLINE',
          scopeRefId,
          reason
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || 'Failed to submit exception request');
        return;
      }

      setReason('');
      await load();
    } catch {
      setError('Failed to submit exception request');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Exception request workflow (WF-005)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Input
            aria-label="Deadline reference id"
            value={scopeRefId}
            onChange={(e) => setScopeRefId(e.target.value)}
            placeholder="Deadline reference id"
          />
          <Textarea
            aria-label="Exception reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this exception is needed"
          />
          <Button onClick={submitException} disabled={saving || reason.length < 10}>
            Submit exception
          </Button>
        </CardContent>
      </Card>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && !error && !exceptions.length ? (
        <EmptyState title="No exception requests yet" hint="Submit your first deadline or procedure exception above." />
      ) : null}

      {exceptions.map((item) => (
        <Card key={item.id}>
          <CardContent className="space-y-1 p-4 text-sm">
            <p className="font-medium">{item.scopeType} exception</p>
            <p>{item.reason}</p>
            {item.decisionRationale ? <p>Decision rationale: {item.decisionRationale}</p> : null}
            <Badge>{item.state}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
