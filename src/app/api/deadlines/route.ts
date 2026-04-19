import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/lib/errors';
import { listDeadlinesForRole } from '@/modules/institutional/service';

export async function GET(request: NextRequest) {
  const roleParam = request.nextUrl.searchParams.get('role');
  const userId = request.nextUrl.searchParams.get('userId');
  const mobilityRecordId = request.nextUrl.searchParams.get('mobilityRecordId') || undefined;

  try {
    if (!roleParam || !userId) {
      return NextResponse.json({ error: 'role and userId are required' }, { status: 400 });
    }

    if (roleParam !== 'student' && roleParam !== 'coordinator') {
      return NextResponse.json({ error: 'role must be student or coordinator' }, { status: 400 });
    }

    const role = roleParam as 'student' | 'coordinator';
    const deadlines = await listDeadlinesForRole({ role, userId, mobilityRecordId });
    return NextResponse.json({ deadlines });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error('[GET /api/deadlines]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
