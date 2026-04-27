'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/states/error-state';

const KINDS = ['recommendation', 'tip', 'review', 'opinion'] as const;
const TOPICS = ['accommodation', 'transport', 'bureaucracy', 'academics', 'daily_living'] as const;

type Kind = (typeof KINDS)[number];

type ContentItem = {
  id: string;
  kind: Kind;
  title: string;
  body: string;
  rating: number | null;
  destinationCity: string;
  topicCategory: string;
  state: string;
  moderationState: string;
  authorId: string;
  author: { fullName: string };
  placeContext: { id: string; label: string; city: string } | null;
  isFavorited: boolean;
};

type Place = { id: string; label: string; city: string };

export default function SocialContentPage() {
  const params = useSearchParams();
  const userId = params.get('userId') || 'student-1';

  const [items, setItems] = useState<ContentItem[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [favorites, setFavorites] = useState<ContentItem[]>([]);
  const [kindFilter, setKindFilter] = useState<string>('');
  const [topicFilter, setTopicFilter] = useState<string>('');
  const [cityFilter, setCityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [mineOnly, setMineOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    contentId: '',
    kind: 'recommendation' as Kind,
    title: '',
    body: '',
    rating: '',
    destinationCity: 'Barcelona',
    topicCategory: 'accommodation',
    placeContextId: ''
  });

  const isEditing = useMemo(() => !!form.contentId, [form.contentId]);

  async function load() {
    setError(null);
    const query = new URLSearchParams({ userId, search, destinationCity: cityFilter, mineOnly: String(mineOnly) });
    if (kindFilter) query.set('kind', kindFilter);
    if (topicFilter) query.set('topicCategory', topicFilter);
    const response = await fetch(`/api/social/content?${query.toString()}`);
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Failed to load content');
      return;
    }
    setItems(data.items || []);
    setPlaces(data.places || []);

    const favoritesResponse = await fetch(`/api/social/favorites?userId=${userId}`);
    const favoritesData = await favoritesResponse.json();
    if (favoritesResponse.ok) {
      setFavorites((favoritesData.favorites || []).map((entry: { socialContent: ContentItem }) => entry.socialContent));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function saveContent() {
    const payload = {
      userId,
      kind: form.kind,
      title: form.title,
      body: form.body,
      rating: form.rating ? Number(form.rating) : undefined,
      destinationCity: form.destinationCity,
      topicCategory: form.topicCategory,
      placeContextId: form.placeContextId || undefined
    };

    const response = await fetch('/api/social/content', {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(isEditing ? { ...payload, contentId: form.contentId } : payload)
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Failed to save content');
      return;
    }

    setForm({
      contentId: '',
      kind: 'recommendation',
      title: '',
      body: '',
      rating: '',
      destinationCity: 'Barcelona',
      topicCategory: 'accommodation',
      placeContextId: ''
    });
    await load();
  }

  async function removeContent(contentId: string) {
    const response = await fetch('/api/social/content', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, contentId })
    });
    const data = await response.json();
    if (!response.ok) setError(data.error || 'Delete failed');
    await load();
  }

  async function toggleFavorite(contentId: string, currentlyFavorited: boolean) {
    const response = await fetch('/api/social/favorites', {
      method: currentlyFavorited ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, contentId })
    });
    const data = await response.json();
    if (!response.ok) setError(data.error || 'Favorite action failed');
    await load();
  }

  async function report(item: ContentItem) {
    const response = await fetch('/api/social/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        targetType: item.kind,
        targetContentId: item.id,
        reportReason: 'Potentially unsafe or out-of-scope Erasmus content',
        reportDetails: `Reported from social content board by ${userId}`
      })
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Report failed');
      return;
    }
    await load();
  }

  function startEdit(item: ContentItem) {
    setForm({
      contentId: item.id,
      kind: item.kind,
      title: item.title,
      body: item.body,
      rating: item.rating?.toString() || '',
      destinationCity: item.destinationCity,
      topicCategory: item.topicCategory,
      placeContextId: item.placeContext?.id || ''
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Content board · filter → visible list → detail actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Results include only backend-visible items. Moderation and visibility enforcement are unchanged; this page improves discoverability only.</p>
          <div className="grid gap-2 md:grid-cols-4">
            <Input placeholder="Search text" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Input placeholder="City" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} />
            <select className="rounded border px-2 text-sm" value={kindFilter} onChange={(e) => setKindFilter(e.target.value)}>
              <option value="">All content types</option>
              {KINDS.map((kind) => (
                <option key={kind} value={kind}>{kind}</option>
              ))}
            </select>
            <select className="rounded border px-2 text-sm" value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)}>
              <option value="">All topic tags</option>
              {TOPICS.map((topic) => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
            <label className="col-span-2 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} />
              Show my authored items (including moderation-limited states)
            </label>
            <Button onClick={load}>Apply filters</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge>{items.length} visible item(s)</Badge>
            <Badge className="border bg-white">{favorites.length} saved item(s)</Badge>
            <Badge className="border bg-white">Visibility: moderation-policy filtered</Badge>
          </div>
        </CardContent>
      </Card>

      {error ? <ErrorState message={error} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit my content item' : 'Create content item'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid gap-2 md:grid-cols-3">
            <select className="rounded border px-2 text-sm" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as Kind })}>
              {KINDS.map((kind) => (
                <option key={kind} value={kind}>{kind}</option>
              ))}
            </select>
            <Input value={form.destinationCity} onChange={(e) => setForm({ ...form, destinationCity: e.target.value })} placeholder="Destination city" />
            <select className="rounded border px-2 text-sm" value={form.topicCategory} onChange={(e) => setForm({ ...form, topicCategory: e.target.value })}>
              {TOPICS.map((topic) => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </div>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" />
          <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Erasmus-relevant text" />
          {form.kind === 'review' || form.kind === 'opinion' ? (
            <Input type="number" min={1} max={5} value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} placeholder="Rating 1-5" />
          ) : null}
          <select className="w-full rounded border px-2 py-2 text-sm" value={form.placeContextId} onChange={(e) => setForm({ ...form, placeContextId: e.target.value })}>
            <option value="">No place context</option>
            {places.map((place) => (
              <option key={place.id} value={place.id}>{place.label} ({place.city})</option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button onClick={saveContent}>{isEditing ? 'Save edits' : 'Publish item'}</Button>
            {isEditing ? (
              <Button variant="outline" onClick={() => setForm({ ...form, contentId: '', title: '', body: '', rating: '' })}>
                Cancel edit
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filtered visible items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {items.map((item) => (
            <div key={item.id} className="rounded border p-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{item.title}</p>
                <Badge>{item.kind}</Badge>
                <Badge className="border bg-white">topic: {item.topicCategory}</Badge>
                <Badge className="border bg-white">city: {item.destinationCity}</Badge>
                {item.rating ? <Badge className="bg-slate-200">Rating {item.rating}/5</Badge> : null}
                <Badge className="border bg-white">moderation: {item.moderationState}</Badge>
              </div>
              <p className="mt-1">{item.body}</p>
              <p className="text-xs text-muted-foreground">
                by {item.author.fullName} · visibility state: {item.state}
                {item.placeContext ? ` · place: ${item.placeContext.label}` : ''}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button variant={item.isFavorited ? 'default' : 'outline'} onClick={() => toggleFavorite(item.id, item.isFavorited)}>
                  {item.isFavorited ? 'Unsave' : 'Save'}
                </Button>
                <Button variant="outline" onClick={() => report(item)}>Report</Button>
                {item.authorId === userId ? (
                  <>
                    <Button onClick={() => startEdit(item)}>Edit</Button>
                    <Button variant="destructive" onClick={() => removeContent(item.id)}>Delete</Button>
                  </>
                ) : null}
              </div>
            </div>
          ))}
          {!items.length ? <p className="text-muted-foreground">No accessible social content found.</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved favorites</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {favorites.map((favorite) => (
            <p key={favorite.id}>• {favorite.title} ({favorite.kind})</p>
          ))}
          {!favorites.length ? <p className="text-muted-foreground">No saved items yet.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
