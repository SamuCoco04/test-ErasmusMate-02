'use client';

import { useEffect, useMemo, useState } from 'react';
import { ContextualLink } from '@/components/shell/contextual-link';

type DemoRole = 'student' | 'coordinator' | 'administrator';

type DemoPreset = {
  role: DemoRole;
  label: string;
  userId: string;
  institutionalHref: string;
  socialHref?: string;
};

const DEMO_PRESETS: DemoPreset[] = [
  {
    role: 'student',
    label: 'Student',
    userId: 'student-1',
    institutionalHref: '/student/dashboard',
    socialHref: '/social/profile'
  },
  {
    role: 'coordinator',
    label: 'Coordinator',
    userId: 'coordinator-1',
    institutionalHref: '/coordinator/review-queue'
  },
  {
    role: 'administrator',
    label: 'Admin',
    userId: 'admin-1',
    institutionalHref: '/admin'
  }
];

export const STORAGE_KEY = 'erasmusmate-demo-role';

export function resolveDemoPreset(role: DemoRole): DemoPreset {
  return DEMO_PRESETS.find((preset) => preset.role === role) ?? DEMO_PRESETS[0];
}

export function DemoRoleContext({
  role,
  availableRoles = ['student', 'coordinator', 'administrator']
}: {
  role: DemoRole;
  availableRoles?: DemoRole[];
}) {
  const activePreset = useMemo(() => resolveDemoPreset(role), [role]);
  const [savedRole, setSavedRole] = useState<DemoRole | null>(null);
  const visiblePresets = DEMO_PRESETS.filter((preset) => availableRoles.includes(preset.role));

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as DemoRole | null;
    setSavedRole(stored);
    window.localStorage.setItem(STORAGE_KEY, role);
  }, [role]);

  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
      <p className="font-semibold uppercase tracking-[0.12em] text-slate-500">Demo context</p>
      <p className="mt-1">Active preset: {activePreset.label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {visiblePresets.map((preset) => (
          <ContextualLink
            key={preset.role}
            href={preset.institutionalHref}
            onClick={() => window.localStorage.setItem(STORAGE_KEY, preset.role)}
            forceUserId={preset.userId}
            className={`rounded border px-2 py-1 ${preset.role === role ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700'}`}
          >
            {preset.label}
          </ContextualLink>
        ))}
      </div>
      {savedRole && savedRole !== role ? (
        <p className="mt-2 text-slate-500">Last session: {resolveDemoPreset(savedRole).label}</p>
      ) : null}
      <p className="mt-2 text-slate-500">This switcher assists navigation; query params still carry deterministic demo identity.</p>
    </div>
  );
}

export function DemoAccessSwitcher() {
  const [savedRole, setSavedRole] = useState<DemoRole>('student');

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as DemoRole | null;
    if (stored) setSavedRole(stored);
  }, []);

  const continuePreset = resolveDemoPreset(savedRole);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div>
          <p className="text-sm font-semibold text-slate-800">Continue last demo context</p>
          <p className="text-xs text-slate-600">Reopen the most recent role preset quickly. Deep-link query params remain supported for scripted reliability.</p>
        </div>
        <div className="flex gap-2">
          <ContextualLink
            href={continuePreset.institutionalHref}
            forceUserId={continuePreset.userId}
            className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Continue as {continuePreset.label}
          </ContextualLink>
          {continuePreset.socialHref ? (
            <ContextualLink
              href={continuePreset.socialHref}
              forceUserId={continuePreset.userId}
              className="inline-flex items-center justify-center rounded-md border bg-white px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              Open social layer
            </ContextualLink>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {DEMO_PRESETS.map((preset) => (
          <div key={preset.role} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">{preset.label} preset</p>
            <p className="mt-1 text-xs text-slate-600">Stable demo identity: {preset.userId}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <ContextualLink
                href={preset.institutionalHref}
                onClick={() => window.localStorage.setItem(STORAGE_KEY, preset.role)}
                forceUserId={preset.userId}
                className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Institutional core
              </ContextualLink>
              {preset.socialHref ? (
                <ContextualLink
                  href={preset.socialHref}
                  onClick={() => window.localStorage.setItem(STORAGE_KEY, preset.role)}
                  forceUserId={preset.userId}
                  className="inline-flex items-center justify-center rounded-md border bg-white px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  Social layer
                </ContextualLink>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
