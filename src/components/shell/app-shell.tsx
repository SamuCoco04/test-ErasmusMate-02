import Link from 'next/link';
import type { Route } from 'next';

import { ShellHeaderBlock, ShellKpiRow, ShellSectionPanel } from '@/components/shell/shell-primitives';

function getTopLayerLinks(role: 'student' | 'coordinator' | 'administrator') {
  const institutionalHref =
    role === 'coordinator'
      ? '/coordinator/review-queue?userId=coordinator-1'
      : role === 'administrator'
        ? '/admin?userId=admin-1'
        : '/student/dashboard?userId=student-1';

  const links: { href: string; label: string; emphasis: 'primary' | 'secondary' }[] = [
    { href: institutionalHref, label: 'Institutional Core', emphasis: 'primary' }
  ];

  if (role === 'student') {
    links.push({ href: '/social/profile?userId=student-1', label: 'Social Support Layer', emphasis: 'secondary' });
  }

  return links;
}

const studentLinkGroups = [
  {
    heading: 'Student Workflow',
    links: [
      { href: '/student/dashboard?userId=student-1', label: 'Mobility Dashboard' },
      { href: '/student/submissions?userId=student-1', label: 'My Submissions' },
      { href: '/student/learning-agreement?userId=student-1', label: 'My Learning Agreement' }
    ]
  },
  {
    heading: 'Records & Rules',
    links: [
      { href: '/student/mobility-record?userId=student-1', label: 'My Mobility Record' },
      { href: '/student/deadlines?userId=student-1', label: 'Deadlines' },
      { href: '/student/exceptions?userId=student-1', label: 'Exception Requests' }
    ]
  }
];

const coordinatorLinkGroups = [
  {
    heading: 'Review Operations',
    links: [
      { href: '/coordinator/review-queue?userId=coordinator-1', label: 'Review Queue' },
      { href: '/coordinator/learning-agreements?userId=coordinator-1', label: 'Learning Agreement Review' },
      { href: '/coordinator/submissions?userId=coordinator-1', label: 'Submission History' }
    ]
  },
  {
    heading: 'Governance',
    links: [
      { href: '/coordinator/deadlines?userId=coordinator-1', label: 'Deadline View' },
      { href: '/coordinator/exceptions?userId=coordinator-1', label: 'Exception Decisions' }
    ]
  }
];

const adminLinkGroups = [
  {
    heading: 'Administration',
    links: [
      { href: '/admin?userId=admin-1', label: 'Admin Home' },
      { href: '/admin/moderation?userId=admin-1', label: 'Moderation Queue' }
    ]
  }
];

export function AppShell({
  role,
  children
}: {
  role: 'student' | 'coordinator' | 'administrator';
  children: React.ReactNode;
}) {
  const groups =
    role === 'student' ? studentLinkGroups : role === 'coordinator' ? coordinatorLinkGroups : adminLinkGroups;
  const topLayerLinks = getTopLayerLinks(role);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white/95">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">ErasmusMate</p>
            <p className="text-sm font-medium text-slate-800">Institutional Core Workspace</p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            {topLayerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href as Route}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                  link.emphasis === 'primary'
                    ? 'border-slate-300 bg-slate-900 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-12 gap-6 px-6 py-6">
        <aside className="col-span-12 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:col-span-3">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{role} role</p>
          <nav className="space-y-5">
            {groups.map((group) => (
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
            badge={<span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">Primary Layer</span>}
            title="Institutional Erasmus Mobility Management"
            subtitle="Official mobility workflows, review operations, and policy-driven actions remain the primary product surface."
            actions={<span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Role: {role}</span>}
          />
          <ShellKpiRow
            items={[
              { label: 'Layer Priority', value: 'Primary Institutional Core', tone: 'accent' },
              { label: 'Navigation Model', value: 'Workflow-first' },
              { label: 'State Handling', value: 'Operational + policy aware' },
              { label: 'Secondary Access', value: 'Social support available' }
            ]}
          />
          <ShellSectionPanel
            title="Institutional workspace"
            description="Use the left navigation to access role-specific procedures, approvals, deadlines, and exception management."
          >
            <div className="space-y-4">{children}</div>
          </ShellSectionPanel>
        </main>
      </div>
    </div>
  );
}
