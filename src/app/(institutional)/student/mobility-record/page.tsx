'use client';

import { useEffect, useMemo, useState } from 'react';
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
      acceptedAt?: string | null;
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

  const totals = useMemo(() => {
    const rows = data?.summary.agreement?.rows ?? [];
    return rows.reduce((acc, row) => acc + row.ects, 0);
  }, [data]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>My Mobility Record</CardTitle>
          <p className="text-sm text-muted-foreground">
            Institutional record area combining your editable Learning Agreement workflow and the read-only Academic Summary.
          </p>
        </CardHeader>
      </Card>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}

      {data && data.summary.agreement ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
              <span>Academic Summary (Read-only)</span>
              <Badge>{data.summary.agreement.state}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded border bg-slate-50 p-2 text-xs">Agreement ID: {data.summary.agreement.id}</div>
              <div className="rounded border bg-slate-50 p-2 text-xs">Approved rows: {data.summary.agreement.rows.length}</div>
              <div className="rounded border bg-slate-50 p-2 text-xs">Total approved ECTS: {totals}</div>
            </div>

            {!data.summary.agreement.rows.length ? (
              <EmptyState title="No approved rows yet" hint="Approved rows will appear after coordinator validation." />
            ) : (
              <div className="overflow-x-auto rounded border">
                <table className="min-w-full divide-y text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-600">
                    <tr>
                      <th className="px-3 py-2">Home Institution</th>
                      <th className="px-3 py-2">Host Institution</th>
                      <th className="px-3 py-2">Semester</th>
                      <th className="px-3 py-2">ECTS</th>
                      <th className="px-3 py-2">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y bg-white">
                    {data.summary.agreement.rows.map((row) => (
                      <tr key={row.id}>
                        <td className="px-3 py-2 align-top">
                          <p className="font-medium">{row.homeCourseCode}</p>
                          <p className="text-xs text-muted-foreground">{row.homeCourseName}</p>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <p className="font-medium">{row.destinationCourseCode}</p>
                          <p className="text-xs text-muted-foreground">{row.destinationCourseName}</p>
                        </td>
                        <td className="px-3 py-2">{row.semester}</td>
                        <td className="px-3 py-2">{row.ects}</td>
                        <td className="px-3 py-2">{row.grade || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {data && !data.summary.agreement ? (
        <EmptyState title="No Learning Agreement yet" hint="Start from My Learning Agreement to build and submit your equivalences." />
      ) : null}
    </div>
  );
}
