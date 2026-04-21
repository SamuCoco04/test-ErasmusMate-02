'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/states/error-state';

type DetailItem = {
  id: string;
  title: string;
  body: string;
  kind: string;
  rating: number | null;
  destinationCity: string;
  topicCategory: string;
  author: { fullName: string };
  placeContext: { label: string; city: string; country: string; category: string };
  createdAt: string;
};

export default function SocialContentDetailPage() {
  const routeParams = useParams<{ contentId: string }>();
  const params = useSearchParams();
  const userId = params.get('userId') || 'student-1';

  const [detail, setDetail] = useState<DetailItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const response = await fetch(`/api/social/map/items/${routeParams.contentId}?userId=${userId}`);
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to load map detail');
        return;
      }
      setDetail(data.detail);
    }
    load();
  }, [routeParams.contentId, userId]);

  return (
    <div className="space-y-4">
      <Link href={`/social/map?userId=${userId}`}>
        <Button variant="outline">Back to map</Button>
      </Link>

      {error ? <ErrorState message={error} /> : null}

      {detail ? (
        <Card>
          <CardHeader>
            <CardTitle>{detail.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge>{detail.kind}</Badge>
              <Badge className="border bg-white">{detail.destinationCity}</Badge>
              <Badge className="border bg-white">{detail.topicCategory}</Badge>
              {detail.rating ? <Badge>Rating {detail.rating}/5</Badge> : null}
            </div>
            <p>{detail.body}</p>
            <p className="text-muted-foreground">By {detail.author.fullName}</p>
            <p className="text-muted-foreground">
              Place context: {detail.placeContext.label} · {detail.placeContext.city}, {detail.placeContext.country} ({detail.placeContext.category})
            </p>
            <p className="text-xs text-muted-foreground">Published: {new Date(detail.createdAt).toLocaleString()}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
