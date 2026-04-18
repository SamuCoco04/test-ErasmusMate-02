import Link from 'next/link';

const studentLinks = [
  { href: '/student/submissions', label: 'My Submissions' }
];

const coordinatorLinks = [{ href: '/coordinator/review-queue', label: 'Review Queue' }];
const adminLinks = [{ href: '/admin', label: 'Admin Home' }];

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
          <div className="text-sm text-muted-foreground">Role: {role}</div>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl grid-cols-12 gap-4 px-4 py-4">
        <aside className="col-span-12 rounded-lg border bg-white p-3 md:col-span-3">
          <nav className="space-y-1 text-sm">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="block rounded px-2 py-1 hover:bg-muted">
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
