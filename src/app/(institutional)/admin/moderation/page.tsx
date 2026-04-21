'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ErrorState } from '@/components/states/error-state';

const ACTIONS = ['hide', 'remove', 'restrict', 'maintain_visible', 'clear'] as const;

type ModerationCase = {
  id: string;
  targetType: string;
  caseState: string;
  thresholdTriggered: boolean;
  targetContent: { id: string; title: string; body: string; moderationState: string; author: { fullName: string } } | null;
  reports: Array<{ id: string; reportReason: string; reportDetails: string | null; reporter: { fullName: string } }>;
};

export default function AdminModerationPage() {
  const params = useSearchParams();
  const userId = params.get('userId') || 'admin-1';

  const [queue, setQueue] = useState<ModerationCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [summary, setSummary] = useState('');
  const [error, setError] = useState<string | null>(null);

  const selected = queue.find((item) => item.id === selectedCaseId) || null;

  async function load() {
    const response = await fetch(`/api/admin/moderation?userId=${userId}`);
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Failed to load moderation queue');
      return;
    }
    setQueue(data.queue || []);
    if (!selectedCaseId && data.queue?.length) setSelectedCaseId(data.queue[0].id);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function apply(action: (typeof ACTIONS)[number]) {
    if (!selectedCaseId) return;
    const response = await fetch('/api/admin/moderation', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, caseId: selectedCaseId, action, outcomeSummary: summary || `Applied action: ${action}` })
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Failed moderation action');
      return;
    }
    setSummary('');
    await load();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Moderation Queue and Actions (WF-013)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Only administrators can access this queue. Threshold-hidden cases remain blocked from ordinary student visibility until a clearing decision.</p>
          {error ? <ErrorState message={error} /> : null}
          <div className="flex flex-wrap gap-2">
            {queue.map((item) => (
              <Button key={item.id} variant={selectedCaseId === item.id ? 'default' : 'outline'} onClick={() => setSelectedCaseId(item.id)}>
                {item.targetType} · {item.caseState}
                {item.thresholdTriggered ? <Badge className="ml-2 bg-red-100 text-red-800">Threshold hidden</Badge> : null}
              </Button>
            ))}
          </div>
          {!queue.length ? <p className="text-muted-foreground">No moderation cases in queue.</p> : null}
        </CardContent>
      </Card>

      {selected ? (
        <Card>
          <CardHeader>
            <CardTitle>Case detail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="font-medium">Case state:</span> {selected.caseState}</p>
            {selected.targetContent ? (
              <div className="rounded border p-2">
                <p className="font-medium">{selected.targetContent.title}</p>
                <p>{selected.targetContent.body}</p>
                <p className="text-xs text-muted-foreground">Author: {selected.targetContent.author.fullName} · moderation: {selected.targetContent.moderationState}</p>
              </div>
            ) : null}

            <div className="rounded border p-2">
              <p className="mb-1 font-medium">Reports</p>
              {selected.reports.map((report) => (
                <div key={report.id} className="mb-2 rounded border p-2">
                  <p>{report.reportReason}</p>
                  <p className="text-xs text-muted-foreground">Reporter: {report.reporter.fullName}</p>
                  {report.reportDetails ? <p className="text-xs">{report.reportDetails}</p> : null}
                </div>
              ))}
            </div>

            <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Outcome summary for audit trail" />
            <div className="flex flex-wrap gap-2">
              {ACTIONS.map((action) => (
                <Button key={action} variant={action === 'remove' ? 'destructive' : 'outline'} onClick={() => apply(action)}>
                  {action}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
