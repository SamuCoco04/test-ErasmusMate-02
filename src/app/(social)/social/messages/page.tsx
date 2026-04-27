'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/states/error-state';

export default function SocialMessagesPage() {
  const params = useSearchParams();
  const userId = params.get('userId') || 'student-1';

  type ConnectionItem = {
    id: string;
    requesterUserId: string;
    recipientUser: { fullName: string };
    requesterUser: { fullName: string };
    state: string;
    thread?: { permissionState: string } | null;
  };
  type MessageItem = {
    id: string;
    messageText: string;
    sender: { fullName: string };
  };
  const [connections, setConnections] = useState<ConnectionItem[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState('');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const accepted = useMemo(() => connections.filter((c) => c.state === 'accepted' && c.thread?.permissionState === 'permitted'), [connections]);

  async function loadConnections() {
    const response = await fetch(`/api/social/connections?userId=${userId}`);
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Failed to load connections');
      return;
    }
    setConnections(data.connections || []);
    if (!selectedConnectionId && data.connections?.length) {
      const first = data.connections.find(
        (connection: ConnectionItem) => connection.state === 'accepted' && connection.thread?.permissionState === 'permitted'
      );
      if (first) setSelectedConnectionId(first.id);
    }
  }

  async function loadMessages(connectionId: string) {
    if (!connectionId) return;
    const response = await fetch(`/api/social/messages?userId=${userId}&connectionId=${connectionId}`);
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Failed to load messages');
      return;
    }
    setMessages(data.messages || []);
  }

  useEffect(() => {
    loadConnections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (selectedConnectionId) loadMessages(selectedConnectionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConnectionId]);

  async function send() {
    if (!selectedConnectionId || !draft.trim()) return;
    const response = await fetch('/api/social/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, connectionId: selectedConnectionId, messageText: draft })
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Failed to send message');
      return;
    }
    setDraft('');
    await loadMessages(selectedConnectionId);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Messages · eligible connections → thread</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {error ? <ErrorState message={error} /> : null}
          <p className="text-muted-foreground">Messaging is visible only for accepted connections with permitted thread access. Visibility and moderation guards are enforced by backend policy.</p>
          <div className="flex flex-wrap gap-2">
            <Badge>{accepted.length} message-enabled connection(s)</Badge>
            <Badge className="border bg-white">Visibility: accepted + permitted only</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {accepted.map((connection) => (
              <Button key={connection.id} variant={selectedConnectionId === connection.id ? 'default' : 'outline'} onClick={() => setSelectedConnectionId(connection.id)}>
                {connection.requesterUserId === userId ? connection.recipientUser.fullName : connection.requesterUser.fullName}
                <Badge className="ml-2">eligible</Badge>
              </Button>
            ))}
          </div>
          {!accepted.length ? <p className="text-muted-foreground">No accepted connections available for messaging.</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thread detail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="max-h-96 space-y-1 overflow-auto rounded border p-2 text-sm">
            {messages.map((message) => (
              <p key={message.id}>
                <span className="font-medium">{message.sender.fullName}:</span> {message.messageText}
              </p>
            ))}
            {!messages.length ? <p className="text-muted-foreground">No messages yet.</p> : null}
          </div>
          <div className="flex gap-2">
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message" />
            <Button onClick={send}>Send</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
