'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/states/loading-state';
import { ErrorState } from '@/components/states/error-state';
import { EmptyState } from '@/components/states/empty-state';
import { EntityListButton, InstitutionalPageTemplate } from '@/components/institutional/page-template';
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

  const ordered = useMemo(() => [...deadlines].sort((a, b) => +new Date(a.overrideDueAt || a.dueAt) - +new Date(b.overrideDueAt || b.dueAt)), [deadlines]);

  return (
    <InstitutionalPageTemplate
      title="Coordinator Deadline Risk View"
      subtitle="Prioritize near-due obligations across assigned mobility records."
      contextSummary={<p className="text-sm">Tracked deadlines: <strong>{ordered.length}</strong> · Requirement: REQ-052</p>}
      primaryRegion={
        <div className="space-y-2 text-sm">
          {loading ? <LoadingState label="Loading deadline risks..." /> : null}
          {error ? <ErrorState message={error} /> : null}
          {!loading && !error && !ordered.length ? <EmptyState title="No coordinator deadlines" /> : null}
          {ordered.map((deadline) => (
            <EntityListButton key={deadline.id}>
              <div className="space-y-1">
                <div className="flex items-center justify-between"><p className="font-medium">{deadline.title}</p><Badge>{deadline.effectiveState}</Badge></div>
                <p className="text-xs text-muted-foreground">Student: {deadline.mobilityRecord.student.fullName}</p>
                <p className="text-xs text-muted-foreground">Due: {new Date(deadline.overrideDueAt || deadline.dueAt).toLocaleString()}</p>
              </div>
            </EntityListButton>
          ))}
        </div>
      }
      activityRegion={<p className="text-xs text-muted-foreground">Risk ordering is ascending by effective due date.</p>}
    />
  );
}
