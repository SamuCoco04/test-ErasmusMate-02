import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-bold">ErasmusMate - Institutional Phase 2 MVP</h1>
      <Card>
        <CardHeader>
          <CardTitle>Institutional core routes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Use deterministic demo users via query params.</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <Link className="text-blue-600 underline" href="/student/dashboard?userId=student-1">
                Student mobility dashboard
              </Link>
            </li>
            <li>
              <Link className="text-blue-600 underline" href="/student/submissions?userId=student-1">
                Student submissions
              </Link>
            </li>
            <li>
              <Link className="text-blue-600 underline" href="/student/exceptions?userId=student-1">
                Student exception requests
              </Link>
            </li>
            <li>
              <Link className="text-blue-600 underline" href="/coordinator/review-queue?userId=coordinator-1">
                Coordinator review queue
              </Link>
            </li>
            <li>
              <Link className="text-blue-600 underline" href="/coordinator/exceptions?userId=coordinator-1">
                Coordinator exception decisions
              </Link>
            </li>
            <li>
              <Link className="text-blue-600 underline" href="/social/profile?userId=student-1">
                Social profile and discovery foundation
              </Link>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
