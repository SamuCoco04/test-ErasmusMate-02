import Link from 'next/link';
import type { Route } from 'next';

const studentLinks = [
  { href: '/student/dashboard?userId=student-1', label: 'Mobility Dashboard' },
  { href: '/student/submissions?userId=student-1', label: 'My Submissions' },
  { href: '/student/deadlines?userId=student-1', label: 'Deadlines' },
  { href: '/student/exceptions?userId=student-1', label: 'Exception Requests' }
];

const coordinatorLinks = [
  { href: '/coordinator/review-queue?userId=coordinator-1', label: 'Review Queue' },
  { href: '/coordinator/submissions?userId=coordinator-1', label: 'Submission History' },
  { href: '/coordinator/deadlines?userId=coordinator-1', label: 'Deadline View' },
  { href: '/coordinator/exceptions?userId=coordinator-1', label: 'Exception Decisions' }
];

const adminLinks = [
  { href: '/admin?userId=admin-1', label: 'Admin Home' },
  { href: '/admin/moderation?userId=admin-1', label: 'Moderation Queue' }
];

export function AppShell({
  role,
  children
}: {
  role: 'student' | 'coordinator' | 'administrator';
  children: React.ReactNode;
}) {
  const links = role === 'student' ? studentLinks : role === 'coordinator' ? coordinatorLinks : adminLinks;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <h1 className="font-semibold">ErasmusMate Institutional Core</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>Role: {role}</span>
            {role === 'student' ? (
              <Link href="/social/profile?userId=student-1" className="text-blue-700 underline">
                Go to Social Support
              </Link>
            ) : null}
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl grid-cols-12 gap-4 px-4 py-4">
        <aside className="col-span-12 rounded-lg border bg-white p-3 md:col-span-3">
          <nav className="space-y-1 text-sm">
            {links.map((link) => (
              <Link key={link.href} href={link.href as Route} className="block rounded px-2 py-1 hover:bg-muted">
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="col-span-12 md:col-span-9">{children}</main>
      </div>
    </div>
  );
}
