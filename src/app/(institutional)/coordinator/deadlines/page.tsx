'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/states/loading-state';
import { ErrorState } from '@/components/states/error-state';
import { EmptyState } from '@/components/states/empty-state';
import type { CoordinatorDeadlineItem } from '@/modules/institutional/types';

export default function CoordinatorDeadlinesPage() {
  const params = useSearchParams();
  const userId = params.get('userId') || 'coordinator-1';

  const [deadlines, setDeadlines] = useState<CoordinatorDeadlineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/deadlines?role=coordinator&userId=${userId}`);
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || 'Failed to load deadline risk view');
        return;
      }
      setDeadlines(payload.deadlines || []);
      setError(null);
    } catch {
      setError('Failed to load deadline risk view');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const ordered = useMemo(
    () => [...deadlines].sort((a, b) => +new Date(a.overrideDueAt || a.dueAt) - +new Date(b.overrideDueAt || b.dueAt)),
    [deadlines]
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Coordinator deadline risk view (REQ-052)</CardTitle>
        </CardHeader>
      </Card>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}

      {!loading && !error && !ordered.length ? (
        <EmptyState title="No coordinator deadlines" hint="All currently assigned deadlines are resolved or not yet generated." />
      ) : null}

      {ordered.map((deadline) => (
        <Card key={deadline.id}>
          <CardContent className="space-y-1 p-4 text-sm">
            <p className="font-medium">{deadline.title}</p>
            <p>Student: {deadline.mobilityRecord.student.fullName}</p>
            <p>Due: {new Date(deadline.overrideDueAt || deadline.dueAt).toLocaleString()}</p>
            <Badge>{deadline.effectiveState}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
