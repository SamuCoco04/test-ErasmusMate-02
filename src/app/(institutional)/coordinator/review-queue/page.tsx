'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { LoadingState } from '@/components/states/loading-state';

type QueueItem = {
  id: string;
  state: string;
  student: { fullName: string };
  procedureDefinition: { title: string };
  events: { id: string; toState: string; rationale?: string | null; createdAt: string }[];
};

export default function CoordinatorReviewQueuePage() {
  const params = useSearchParams();
  const userId = params.get('userId') || 'coordinator-1';

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rationale, setRationale] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const response = await fetch(`/api/submissions?role=coordinator&userId=${userId}`);
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || 'Failed to load queue');
      setLoading(false);
      return;
    }

    setQueue(data.queue || []);
    setSelectedId((prev) => prev ?? data.queue?.[0]?.id ?? null);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const selected = queue.find((item) => item.id === selectedId) || null;

  async function act(action: 'start_review' | 'approve' | 'reject' | 'reopen') {
    if (!selected) return;
    setSaving(true);
    setError(null);
    const response = await fetch(`/api/submissions/${selected.id}/transition`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action, rationale: rationale || undefined })
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Action failed');
    }
    setRationale('');
    await load();
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Coordinator Review Queue (WF-003)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">Start review, approve, reject with rationale, and reopen when needed.</CardContent>
      </Card>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}

      {!loading && !queue.length ? (
        <EmptyState title="Review queue empty" hint="Submissions will appear after students submit or resubmit." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {queue.map((item) => (
                <button
                  key={item.id}
                  className={`w-full rounded border px-3 py-2 text-left ${selectedId === item.id ? 'border-blue-600' : ''}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <p className="font-medium">{item.student.fullName}</p>
                  <p>{item.procedureDefinition.title}</p>
                  <Badge className="mt-1">{item.state}</Badge>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Review panel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {selected ? (
                <>
                  <p className="font-mono text-xs text-muted-foreground">Submission: {selected.id}</p>
                  <p>
                    <strong>Student:</strong> {selected.student.fullName}
                  </p>
                  <p>
                    <strong>Procedure:</strong> {selected.procedureDefinition.title}
                  </p>
                  <Textarea
                    value={rationale}
                    onChange={(event) => setRationale(event.target.value)}
                    placeholder="Required for reject/reopen"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <Button disabled={saving} variant="outline" onClick={() => act('start_review')}>
                      Start Review
                    </Button>
                    <Button disabled={saving} onClick={() => act('approve')}>
                      Approve
                    </Button>
                    <Button disabled={saving} variant="destructive" onClick={() => act('reject')}>
                      Reject
                    </Button>
                    <Button disabled={saving} variant="outline" onClick={() => act('reopen')}>
                      Reopen
                    </Button>
                  </div>

                  <div className="rounded border bg-slate-50 p-2 text-xs">
                    <p className="mb-1 font-medium">Recent transitions</p>
                    <ul className="space-y-1">
                      {selected.events.map((event) => (
                        <li key={event.id}>
                          {new Date(event.createdAt).toLocaleString()} → {event.toState}
                          {event.rationale ? ` (${event.rationale})` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <EmptyState title="Select a submission" />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
