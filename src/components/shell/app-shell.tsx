import Link from 'next/link';

type Role = 'student' | 'coordinator' | 'administrator';

type LinkDef = {
  href: string;
  label: string;
};

const linksByRole: Record<Role, LinkDef[]> = {
  student: [{ href: '/student/submissions', label: 'My Submissions' }],
  coordinator: [{ href: '/coordinator/review-queue', label: 'Review Queue' }],
  administrator: [{ href: '/admin', label: 'Admin Home' }]
};

export function AppShell({
  role,
  userId,
  children
}: {
  role: Role;
  userId: string;
  children: React.ReactNode;
}) {
  const links = linksByRole[role];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <h1 className="font-semibold">ErasmusMate Institutional Core</h1>
          <div className="text-sm text-muted-foreground">
            Role: {role} · User: {userId}
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl grid-cols-12 gap-4 px-4 py-4">
        <aside className="col-span-12 rounded-lg border bg-white p-3 md:col-span-3">
          <nav className="space-y-1 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={{ pathname: link.href, query: { userId } }}
                className="block rounded px-2 py-1 hover:bg-muted"
              >
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
