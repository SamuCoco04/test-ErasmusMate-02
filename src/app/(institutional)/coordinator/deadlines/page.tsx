'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CoordinatorDeadlinesPage() {
  const params = useSearchParams();
  const userId = params.get('userId') || 'coordinator-1';

  const [deadlines, setDeadlines] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const response = await fetch(`/api/deadlines?role=coordinator&userId=${userId}`);
      const payload = await response.json();
      if (response.ok) {
        setDeadlines(payload.deadlines || []);
      }
    }

    load();
  }, [userId]);

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
