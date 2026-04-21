'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/states/error-state';
import { LoadingState } from '@/components/states/loading-state';

export default function SocialProfilePage() {
  const params = useSearchParams();
  const userId = params.get('userId') || 'student-1';

  type ProfileForm = {
    mobilityRecordId: string;
    headline: string;
    bio: string;
    languages: string;
    interests: string;
    discoverable: boolean;
    contactable: boolean;
    discoverabilityConsent: boolean;
    contactabilityConsent: boolean;
    visibility: Record<string, boolean>;
  };
  const [profile, setProfile] = useState<ProfileForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const response = await fetch(`/api/social/profile?userId=${userId}`);
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Failed to load social profile');
      setLoading(false);
      return;
    }

    const p = data.profile;
    setProfile({
      mobilityRecordId: p.mobilityRecordId,
      headline: p.headline || '',
      bio: p.bio || '',
      languages: p.languages || '',
      interests: p.interests || '',
      discoverable: p.discoverable,
      contactable: p.contactable,
      discoverabilityConsent: p.consentSettings?.discoverabilityConsent || false,
      contactabilityConsent: p.consentSettings?.contactabilityConsent || false,
      visibility: p.visibilitySettings
    });
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  function toggle(path: string) {
    setProfile((current) => {
      if (!current) return current;
      if (path.startsWith('visibility.')) {
        const key = path.replace('visibility.', '');
        return { ...current, visibility: { ...current.visibility, [key]: !current.visibility[key] } };
      }
      return { ...current, [path]: !current[path] };
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    const response = await fetch('/api/social/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...profile, userId })
    });

    const data = await response.json();
    if (!response.ok) setError(data.error || 'Failed to save profile');
    await load();
    setSaving(false);
  }

  if (loading) return <LoadingState />;
  if (!profile) return <ErrorState message={error || 'Profile unavailable'} />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Profile, Consent, and Visibility (WF-009)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {error ? <ErrorState message={error} /> : null}
        <Input value={profile.headline} onChange={(e) => setProfile({ ...profile, headline: e.target.value })} placeholder="Headline" />
        <Textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="Erasmus context bio" />
        <Input value={profile.languages} onChange={(e) => setProfile({ ...profile, languages: e.target.value })} placeholder="Languages" />
        <Input value={profile.interests} onChange={(e) => setProfile({ ...profile, interests: e.target.value })} placeholder="Interests" />

        <div className="grid gap-2 rounded border p-3 md:grid-cols-2">
          {[
            ['discoverabilityConsent', 'Discoverability consent'],
            ['contactabilityConsent', 'Contactability consent'],
            ['discoverable', 'Discoverable profile'],
            ['contactable', 'Contactable profile']
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2">
              <input type="checkbox" checked={profile[key]} onChange={() => toggle(key)} />
              {label}
            </label>
          ))}
        </div>

        <div className="grid gap-2 rounded border p-3 md:grid-cols-2">
          {Object.entries(profile.visibility).map(([key, value]) => (
            <label key={key} className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={Boolean(value)} onChange={() => toggle(`visibility.${key}`)} />
              {key}
            </label>
          ))}
        </div>

        <Button disabled={saving} onClick={save}>
          Save social profile settings
        </Button>
      </CardContent>
    </Card>
  );
}
