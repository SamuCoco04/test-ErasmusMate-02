'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/states/loading-state';
import { ErrorState } from '@/components/states/error-state';

export default function StudentDeadlinesPage() {
  const params = useSearchParams();
  const userId = params.get('userId') || 'student-1';

  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const response = await fetch(`/api/deadlines?role=student&userId=${userId}`);
        const payload = await response.json();

        if (!response.ok) {
          setError(payload.error || 'Failed to load deadlines');
          return;
        }

        setDeadlines(payload.deadlines || []);
        setError(null);
      } catch {
        setError('Failed to load deadlines');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Deadline view (WF-006)</CardTitle>
        </CardHeader>
      </Card>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}

      <div className="space-y-3">
        {deadlines.map((deadline) => (
          <Card key={deadline.id}>
            <CardContent className="space-y-1 p-4 text-sm">
              <p className="font-medium">{deadline.title}</p>
              <p>
                Due: {new Date(deadline.overrideDueAt || deadline.dueAt).toLocaleString()}
                {deadline.overrideDueAt ? ' (override applied)' : ''}
              </p>
              <Badge>{deadline.effectiveState}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
