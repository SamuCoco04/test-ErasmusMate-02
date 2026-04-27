import Link from 'next/link';
import { DemoAccessSwitcher } from '@/components/shell/demo-role-switcher';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">ErasmusMate — Demo access</h1>
        <p className="mt-2 text-sm text-slate-600">
          Start from a role preset for reliable walkthroughs. Deterministic deep links (with query params) remain first-class for scripted README journeys.
        </p>
      </div>

      <DemoAccessSwitcher />

      <Card>
        <CardHeader>
          <CardTitle>Scripted deep links (query-param compatible)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Use these direct links for scripted demos that depend on deterministic identities.</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <Link className="text-blue-600 underline" href="/student/dashboard?userId=student-1">
                Student mobility dashboard
              </Link>
            </li>
            <li>
              <Link className="text-blue-600 underline" href="/coordinator/review-queue?userId=coordinator-1">
                Coordinator review queue
              </Link>
            </li>
            <li>
              <Link className="text-blue-600 underline" href="/admin?userId=admin-1">
                Admin governance dashboard
              </Link>
            </li>
            <li>
              <Link className="text-blue-600 underline" href="/social/profile?userId=student-1">
                Student social support profile
              </Link>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
