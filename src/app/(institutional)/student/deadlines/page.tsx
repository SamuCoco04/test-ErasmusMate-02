'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { LoadingState } from '@/components/states/loading-state';
import { EntityListButton, InstitutionalPageTemplate } from '@/components/institutional/page-template';
import type { StudentDeadlineItem } from '@/modules/institutional/types';

export default function StudentDeadlinesPage() {
  const params = useSearchParams();
  const userId = params.get('userId') || 'student-1';
  const [deadlines, setDeadlines] = useState<StudentDeadlineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
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
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <InstitutionalPageTemplate
      title="Student Deadline View"
      subtitle="Track procedure-sensitive obligations and their effective state."
      contextSummary={<p className="text-sm">Open deadlines: <strong>{deadlines.length}</strong> · Workflow: WF-006</p>}
      primaryRegion={
        <div className="space-y-2 text-sm">
          {loading ? <LoadingState label="Loading deadlines..." /> : null}
          {error ? <ErrorState message={error} /> : null}
          {!loading && !error && deadlines.length === 0 ? <EmptyState title="No deadlines found" /> : null}
          {deadlines.map((deadline) => (
            <EntityListButton key={deadline.id}>
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2"><p className="font-medium">{deadline.title}</p><Badge>{deadline.effectiveState}</Badge></div>
                <p className="text-xs text-muted-foreground">Due: {new Date(deadline.overrideDueAt || deadline.dueAt).toLocaleString()}</p>
              </div>
            </EntityListButton>
          ))}
        </div>
      }
      activityRegion={<p className="text-xs text-muted-foreground">Deadline override signals are shown directly in due date calculations.</p>}
    />
  );
}
