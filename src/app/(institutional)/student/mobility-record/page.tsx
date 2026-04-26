'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { LoadingState } from '@/components/states/loading-state';

const MOBILITY_ID = 'mobility-1';

type SummaryPayload = {
  summary: {
    agreement: {
      id: string;
      state: string;
      rows: {
        id: string;
        homeCourseCode: string;
        homeCourseName: string;
        destinationCourseCode: string;
        destinationCourseName: string;
        ects: number;
        semester: string;
        grade?: string | null;
      }[];
    } | null;
  };
};

export default function StudentMobilityRecordPage() {
  const params = useSearchParams();
  const userId = params.get('userId') || 'student-1';

  const [data, setData] = useState<SummaryPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/mobility-records/${MOBILITY_ID}/academic-summary?userId=${userId}`);
        const payload = await response.json();
        if (!response.ok) {
          setError(payload.error || 'Failed to load academic summary');
        } else {
          setData(payload);
        }
      } catch {
        setError('Failed to load academic summary');
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
          <CardTitle>My Mobility Record — Academic Summary</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Read-only institutional summary derived from latest approved Learning Agreement rows.
        </CardContent>
      </Card>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}

      {data && data.summary.agreement ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>Learning Agreement Summary</span>
              <Badge>{data.summary.agreement.state}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {!data.summary.agreement.rows.length ? (
              <EmptyState title="No approved rows yet" hint="Approved rows will appear after coordinator validation." />
            ) : (
              data.summary.agreement.rows.map((row) => (
                <div key={row.id} className="rounded border p-2">
                  <p className="font-medium">{row.homeCourseCode} ({row.homeCourseName})</p>
                  <p>Equivalent: {row.destinationCourseCode} ({row.destinationCourseName})</p>
                  <p className="text-xs text-muted-foreground">ECTS {row.ects} · {row.semester}{row.grade ? ` · Grade ${row.grade}` : ''}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}

      {data && !data.summary.agreement ? <EmptyState title="No Learning Agreement yet" hint="Start from My Learning Agreement to build your academic equivalences." /> : null}
    </div>
  );
}
