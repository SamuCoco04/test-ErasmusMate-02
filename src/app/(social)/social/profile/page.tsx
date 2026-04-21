'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/states/error-state';
import { LoadingState } from '@/components/states/loading-state';

type ToggleKey = 'discoverabilityConsent' | 'contactabilityConsent' | 'discoverable' | 'contactable';
type VisibilityKey =
  | 'showHeadline'
  | 'showBio'
  | 'showLanguages'
  | 'showInterests'
  | 'showDestination'
  | 'showHostInstitution'
  | 'showCity'
  | 'showMobilityPeriod'
  | 'showMobilityStage'
  | 'directContactExposed';

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
  visibility: Record<VisibilityKey, boolean>;
};

export default function SocialProfilePage() {
  const params = useSearchParams();
  const userId = params.get('userId') || 'student-1';

  const [profile, setProfile] = useState<ProfileForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
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
      visibility: {
        showHeadline: p.visibilitySettings?.showHeadline ?? true,
        showBio: p.visibilitySettings?.showBio ?? true,
        showLanguages: p.visibilitySettings?.showLanguages ?? true,
        showInterests: p.visibilitySettings?.showInterests ?? true,
        showDestination: p.visibilitySettings?.showDestination ?? true,
        showHostInstitution: p.visibilitySettings?.showHostInstitution ?? true,
        showCity: p.visibilitySettings?.showCity ?? true,
        showMobilityPeriod: p.visibilitySettings?.showMobilityPeriod ?? true,
        showMobilityStage: p.visibilitySettings?.showMobilityStage ?? true,
        directContactExposed: p.visibilitySettings?.directContactExposed ?? false
      }
    });
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  function toggleKey(key: ToggleKey) {
    setProfile((current) => (current ? { ...current, [key]: !current[key] } : current));
  }

  function toggleVisibilityKey(key: VisibilityKey) {
    setProfile((current) => (current ? { ...current, visibility: { ...current.visibility, [key]: !current.visibility[key] } } : current));
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
              <input type="checkbox" checked={profile[key as ToggleKey]} onChange={() => toggleKey(key as ToggleKey)} />
              {label}
            </label>
          ))}
        </div>

        <div className="grid gap-2 rounded border p-3 md:grid-cols-2">
          {(
            [
              ['showHeadline', 'Show headline'],
              ['showBio', 'Show bio'],
              ['showLanguages', 'Show languages'],
              ['showInterests', 'Show interests'],
              ['showDestination', 'Show destination'],
              ['showHostInstitution', 'Show host institution'],
              ['showCity', 'Show city'],
              ['showMobilityPeriod', 'Show mobility period'],
              ['showMobilityStage', 'Show mobility stage'],
              ['directContactExposed', 'Expose direct contact email']
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={profile.visibility[key]} onChange={() => toggleVisibilityKey(key)} />
              {label}
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
