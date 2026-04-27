'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/states/error-state';
import { SocialMapCanvas } from '@/components/social/social-map-canvas';

const CATEGORIES = ['university_area', 'student_housing_zone', 'transport_hub', 'civic_office', 'daily_living_area'] as const;
const KINDS = ['recommendation', 'tip', 'review', 'opinion'] as const;

type MapItem = {
  id: string;
  title: string;
  excerpt: string;
  kind: string;
  rating: number | null;
  destinationCity: string;
  topicCategory: string;
  author: { id: string; fullName: string };
  place: {
    id: string;
    label: string;
    city: string;
    category: string;
    latitude: number;
    longitude: number;
  };
};

type PlaceCatalog = {
  id: string;
  label: string;
  city: string;
  country: string;
  category: string;
  erasmusScopeTag: string;
};

export default function SocialMapPage() {
  const params = useSearchParams();
  const userId = params.get('userId') || 'student-1';

  const [items, setItems] = useState<MapItem[]>([]);
  const [places, setPlaces] = useState<PlaceCatalog[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [destination, setDestination] = useState('');
  const [category, setCategory] = useState('');
  const [contentType, setContentType] = useState('');
  const [minRating, setMinRating] = useState('');

  const selected = useMemo(() => items.find((item) => item.id === selectedItemId) || items[0] || null, [items, selectedItemId]);
  const handleSelect = useCallback((itemId: string) => setSelectedItemId(itemId), []);

  async function load() {
    setError(null);
    const query = new URLSearchParams({ userId, search, city, destination });
    if (category) query.set('category', category);
    if (contentType) query.set('contentType', contentType);
    if (minRating) query.set('minRating', minRating);

    const [itemsResponse, placesResponse] = await Promise.all([
      fetch(`/api/social/map/items?${query.toString()}`),
      fetch(`/api/social/map/places?userId=${userId}`)
    ]);
    const itemsData = await itemsResponse.json();
    const placesData = await placesResponse.json();

    if (!itemsResponse.ok) {
      setError(itemsData.error || 'Failed to load map items');
      return;
    }

    setItems(itemsData.items || []);
    setSelectedItemId((itemsData.items || [])[0]?.id ?? null);

    if (placesResponse.ok) setPlaces(placesData.places || []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function reportFromMap(itemId: string) {
    const response = await fetch(`/api/social/map/items/${itemId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        reportReason: 'Potential policy mismatch for Erasmus-focused map visibility',
        reportDetails: `Reported from social map by ${userId}`
      })
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Failed to report map content');
      return;
    }
    await load();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Map discovery · filter → result list → marker preview → detail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Map shows only backend-approved place/content visibility. Enforcement is unchanged; this page now clarifies the browsing sequence.</p>
          <div className="grid gap-2 md:grid-cols-3">
            <Input placeholder="Search content" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
            <Input placeholder="Destination" value={destination} onChange={(e) => setDestination(e.target.value)} />
            <select className="rounded border px-2 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All place categories</option>
              {CATEGORIES.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <select className="rounded border px-2 text-sm" value={contentType} onChange={(e) => setContentType(e.target.value)}>
              <option value="">All content types</option>
              {KINDS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <Input placeholder="Min rating 1-5" value={minRating} onChange={(e) => setMinRating(e.target.value)} />
            <Button className="md:col-span-3" onClick={load}>Apply filters</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{items.length} visible map result(s)</Badge>
            <Badge className="border bg-white">Visibility: moderation-policy filtered</Badge>
          </div>
        </CardContent>
      </Card>

      {error ? <ErrorState message={error} /> : null}

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Step 2-3 · Result markers</CardTitle>
          </CardHeader>
          <CardContent>
            <SocialMapCanvas items={items} selectedItemId={selected?.id ?? null} onSelect={handleSelect} />
            <p className="mt-2 text-xs text-muted-foreground">Select from list or click marker. Marker click opens preview details on the right.</p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Step 2 · Filtered result list</CardTitle>
            </CardHeader>
            <CardContent className="max-h-56 space-y-2 overflow-y-auto text-sm">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItemId(item.id)}
                  className={`w-full rounded border p-2 text-left transition ${selected?.id === item.id ? 'border-sky-500 bg-sky-50' : 'hover:bg-slate-50'}`}
                >
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.place.label} · {item.place.city}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge>{item.kind}</Badge>
                    <Badge className="border bg-white">{item.destinationCity}</Badge>
                    {item.rating ? <Badge className="border bg-white">{item.rating}/5</Badge> : null}
                  </div>
                </button>
              ))}
              {!items.length ? <p className="text-muted-foreground">No map-visible content for current filters.</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Step 3-4 · Marker preview and detail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {selected ? (
                <>
                  <div className="space-y-1 rounded border p-2">
                    <p className="font-medium">{selected.title}</p>
                    <p>{selected.excerpt}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{selected.kind}</Badge>
                      <Badge className="border bg-white">topic: {selected.topicCategory}</Badge>
                      <Badge className="border bg-white">place: {selected.place.category}</Badge>
                      {selected.rating ? <Badge>Rating {selected.rating}/5</Badge> : null}
                    </div>
                    <p className="text-xs text-muted-foreground">{selected.place.label} · {selected.place.city} · By {selected.author.fullName}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/social/content/${selected.id}?userId=${userId}`}>
                      <Button>Open detail</Button>
                    </Link>
                    <Button variant="outline" onClick={() => reportFromMap(selected.id)}>Report from map</Button>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">Pick a result to view marker preview details.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Place context catalog</CardTitle>
            </CardHeader>
            <CardContent className="max-h-40 space-y-1 overflow-y-auto text-xs">
              {places.map((place) => (
                <p key={place.id}>• {place.label} ({place.city}) — {place.erasmusScopeTag}</p>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
