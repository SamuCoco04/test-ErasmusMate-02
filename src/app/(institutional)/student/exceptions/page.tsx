'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ErrorState } from '@/components/states/error-state';

const MOBILITY_ID = 'mobility-1';

export default function StudentExceptionsPage() {
  const params = useSearchParams();
  const userId = params.get('userId') || 'student-1';

  const [exceptions, setExceptions] = useState<any[]>([]);
  const [scopeRefId, setScopeRefId] = useState('deadline-1');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const response = await fetch(`/api/exceptions?role=student&userId=${userId}`);
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || 'Failed to load exceptions');
      return;
    }

    setExceptions(payload.exceptions || []);
  }

  useEffect(() => {
    load();
  }, [userId]);

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
          <Input value={scopeRefId} onChange={(e) => setScopeRefId(e.target.value)} placeholder="Deadline reference id" />
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this exception is needed"
          />
          <Button onClick={submitException} disabled={saving || reason.length < 10}>
            Submit exception
          </Button>
        </CardContent>
      </Card>

      {error ? <ErrorState message={error} /> : null}

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
