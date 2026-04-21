import Link from 'next/link';
import type { Route } from 'next';

const socialLinks = [
  { href: '/social/profile?userId=student-1', label: 'My Social Profile' },
  { href: '/social/discover?userId=student-1', label: 'Discover Students' },
  { href: '/social/messages?userId=student-1', label: 'Messages' },
  { href: '/social/content?userId=student-1', label: 'Content & Favorites' }
];

export function SocialShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <h1 className="font-semibold">ErasmusMate Social Support (Secondary Layer)</h1>
          <Link href="/student/dashboard?userId=student-1" className="text-sm text-blue-700 underline">
            Back to Institutional Core
          </Link>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl grid-cols-12 gap-4 px-4 py-4">
        <aside className="col-span-12 rounded-lg border bg-white p-3 md:col-span-3">
          <nav className="space-y-1 text-sm">
            {socialLinks.map((link) => (
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
