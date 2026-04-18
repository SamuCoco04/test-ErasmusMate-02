import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/lib/errors';
import { listDeadlinesForRole } from '@/modules/institutional/service';

export async function GET(request: NextRequest) {
  const role = request.nextUrl.searchParams.get('role') as 'student' | 'coordinator' | null;
  const userId = request.nextUrl.searchParams.get('userId');
  const mobilityRecordId = request.nextUrl.searchParams.get('mobilityRecordId') || undefined;

  try {
    if (!role || !userId) {
      return NextResponse.json({ error: 'role and userId are required' }, { status: 400 });
    }

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
