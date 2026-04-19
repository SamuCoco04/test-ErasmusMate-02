'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

export default function CoordinatorExceptionsPage() {
  const params = useSearchParams();
  const userId = params.get('userId') || 'coordinator-1';

  const [exceptions, setExceptions] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rationale, setRationale] = useState('');

  async function load() {
    const response = await fetch(`/api/exceptions?role=coordinator&userId=${userId}`);
    const payload = await response.json();
    if (response.ok) {
      setExceptions(payload.exceptions || []);
      setSelectedId((prev) => prev ?? payload.exceptions?.[0]?.id ?? null);
    }
  }

  useEffect(() => {
    load();
  }, [userId]);

  const selected = exceptions.find((item) => item.id === selectedId);

  async function action(actionName: 'start_review' | 'approve' | 'reject' | 'apply' | 'close') {
    if (!selected) return;

    const response = await fetch(`/api/exceptions/${selected.id}/decision`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action: actionName, rationale: rationale || undefined })
    });

    if (response.ok) {
      setRationale('');
      await load();
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Exception review & decision (WF-005)</CardTitle>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {exceptions.map((item) => (
              <button
                key={item.id}
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
                  value={rationale}
                  onChange={(event) => setRationale(event.target.value)}
                  placeholder="Rationale (required for rejection)"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => action('start_review')}>Start review</Button>
                  <Button onClick={() => action('approve')}>Approve</Button>
                  <Button variant="destructive" onClick={() => action('reject')}>Reject</Button>
                  <Button variant="outline" onClick={() => action('apply')}>Apply</Button>
                  <Button variant="outline" className="col-span-2" onClick={() => action('close')}>Close</Button>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
