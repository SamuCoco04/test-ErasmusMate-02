import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-bold">ErasmusMate - Phase 1</h1>
      <Card>
        <CardHeader>
          <CardTitle>Role-aware institutional routes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Use deterministic demo users via query params.</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <Link className="text-blue-600 underline" href="/student/submissions?userId=student-1">
                Student submissions
              </Link>
            </li>
            <li>
              <Link className="text-blue-600 underline" href="/coordinator/review-queue?userId=coordinator-1">
                Coordinator review queue
              </Link>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
