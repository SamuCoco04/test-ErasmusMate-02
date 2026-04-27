import Link from 'next/link';
import type { Route } from 'next';

import { ShellHeaderBlock, ShellKpiRow, ShellSectionPanel } from '@/components/shell/shell-primitives';

const socialLinkGroups = [
  {
    heading: 'Social Profile & Discovery',
    links: [
      { href: '/social/profile?userId=student-1', label: 'My Social Profile' },
      { href: '/social/discover?userId=student-1', label: 'Discover Students' },
      { href: '/social/map?userId=student-1', label: 'Map Discovery' }
    ]
  },
  {
    heading: 'Connections & Content',
    links: [
      { href: '/social/messages?userId=student-1', label: 'Messages' },
      { href: '/social/content?userId=student-1', label: 'Content & Favorites' }
    ]
  }
];

export function SocialShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-sky-50/40">
      <header className="border-b border-slate-200 bg-white/95">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">ErasmusMate</p>
            <p className="text-sm font-medium text-slate-800">Social Support Workspace (Secondary Layer)</p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <Link
              href={'/student/dashboard?userId=student-1' as Route}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Institutional Core
            </Link>
            <Link
              href={'/social/profile?userId=student-1' as Route}
              className="rounded-md border border-sky-300 bg-sky-600 px-3 py-1.5 text-sm font-medium text-white"
            >
              Social Support
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-12 gap-6 px-6 py-6">
        <aside className="col-span-12 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:col-span-3">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Student social tools</p>
          <nav className="space-y-5">
            {socialLinkGroups.map((group) => (
              <div key={group.heading}>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{group.heading}</h2>
                <div className="space-y-1">
                  {group.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href as Route}
                      className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <main className="col-span-12 space-y-6 md:col-span-9">
          <ShellHeaderBlock
            badge={<span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">Secondary Layer</span>}
            title="Social Support for Erasmus Students"
            subtitle="Peer discovery, messaging, map-based recommendations, and moderated content support students without replacing institutional workflows."
          />
          <ShellKpiRow
            items={[
              { label: 'Layer Priority', value: 'Secondary to institutional core' },
              { label: 'Moderation Model', value: 'Admin-governed safety' },
              { label: 'Map Experience', value: 'Public places + filters', tone: 'accent' },
              { label: 'Connection Scope', value: 'Accepted peers only' }
            ]}
          />
          <ShellSectionPanel
            title="Social workspace"
            description="Use social tools for peer support, local advice, and non-official experience sharing alongside your official process."
          >
            <div className="space-y-4">{children}</div>
          </ShellSectionPanel>
        </main>
      </div>
    </div>
  );
}
