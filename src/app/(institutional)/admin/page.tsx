import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Administrator Governance Area</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>Institutional governance remains primary. Social moderation is available as a dedicated, role-restricted administrative workflow.</p>
        <Link href="/admin/moderation?userId=admin-1" className="text-blue-700 underline">
          Open moderation queue
        </Link>
      </CardContent>
    </Card>
  );
}
