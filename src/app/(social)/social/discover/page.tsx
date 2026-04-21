'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/states/error-state';

export default function SocialDiscoverPage() {
  const params = useSearchParams();
  const userId = params.get('userId') || 'student-1';

  type DiscoverResult = {
    id: string;
    studentName: string;
    headline: string | null;
    destinationCity: string | null;
    hostInstitution: string | null;
  };
  type ConnectionItem = {
    id: string;
    requesterUserId: string;
    recipientUserId: string;
    requesterUser: { fullName: string };
    recipientUser: { fullName: string };
    state: string;
  };
  const [results, setResults] = useState<DiscoverResult[]>([]);
  const [connections, setConnections] = useState<ConnectionItem[]>([]);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [stage, setStage] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const discovery = await fetch(
      `/api/social/discover?userId=${userId}&search=${encodeURIComponent(search)}&city=${encodeURIComponent(city)}&mobilityStage=${encodeURIComponent(stage)}`
    );
    const discoveryData = await discovery.json();
    if (!discovery.ok) setError(discoveryData.error || 'Discovery failed');
    else setResults(discoveryData.results || []);

    const connectionResponse = await fetch(`/api/social/connections?userId=${userId}`);
    const connectionData = await connectionResponse.json();
    if (connectionResponse.ok) setConnections(connectionData.connections || []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function connect(targetProfileId: string) {
    const response = await fetch('/api/social/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, targetProfileId })
    });
    const data = await response.json();
    if (!response.ok) setError(data.error || 'Connection request failed');
    await load();
  }

  async function act(connectionId: string, action: 'accept' | 'reject' | 'cancel' | 'block') {
    const response = await fetch(`/api/social/connections?connectionId=${connectionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action })
    });
    const data = await response.json();
    if (!response.ok) setError(data.error || 'Connection action failed');
    await load();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Student Discovery and Connection Lifecycle (WF-010)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-4">
          <Input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <Input placeholder="Mobility stage" value={stage} onChange={(e) => setStage(e.target.value)} />
          <Button onClick={load}>Apply filters</Button>
        </CardContent>
      </Card>

      {error ? <ErrorState message={error} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Discoverable students</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {results.map((result) => (
            <div key={result.id} className="rounded border p-2 text-sm">
              <p className="font-medium">{result.studentName}</p>
              <p>{result.headline || 'No headline visible'}</p>
              <p>{result.destinationCity || 'City hidden'} · {result.hostInstitution || 'Institution hidden'}</p>
              <Button size="sm" className="mt-2" onClick={() => connect(result.id)}>
                Send request
              </Button>
            </div>
          ))}
          {!results.length ? <p className="text-sm text-muted-foreground">No eligible discoverable students found.</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My connections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {connections.map((connection) => {
            const counterpart = connection.requesterUserId === userId ? connection.recipientUser.fullName : connection.requesterUser.fullName;
            return (
              <div key={connection.id} className="rounded border p-2">
                <div className="flex items-center justify-between">
                  <p>{counterpart}</p>
                  <Badge>{connection.state}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {connection.state === 'pending' && connection.recipientUserId === userId ? (
                    <>
                      <Button size="sm" onClick={() => act(connection.id, 'accept')}>Accept</Button>
                      <Button size="sm" variant="outline" onClick={() => act(connection.id, 'reject')}>Reject</Button>
                    </>
                  ) : null}
                  {connection.state === 'pending' && connection.requesterUserId === userId ? (
                    <Button size="sm" variant="outline" onClick={() => act(connection.id, 'cancel')}>Cancel pending</Button>
                  ) : null}
                  {['pending', 'accepted'].includes(connection.state) ? (
                    <Button size="sm" variant="destructive" onClick={() => act(connection.id, 'block')}>Block</Button>
                  ) : null}
                </div>
              </div>
            );
          })}
          {!connections.length ? <p className="text-muted-foreground">No connections yet.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
