import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/lib/errors';
import { getStudentInstitutionalDashboard, listAuditTrailForMobility } from '@/modules/institutional/service';

export async function GET(request: NextRequest) {
  const role = request.nextUrl.searchParams.get('role');
  const userId = request.nextUrl.searchParams.get('userId');
  const mobilityRecordId = request.nextUrl.searchParams.get('mobilityRecordId');

  try {
    if (!role || !userId || !mobilityRecordId) {
      return NextResponse.json({ error: 'role, userId and mobilityRecordId are required' }, { status: 400 });
    }

    if (role === 'student') {
      const dashboard = await getStudentInstitutionalDashboard(userId, mobilityRecordId);
      const audit = await listAuditTrailForMobility(mobilityRecordId);
      return NextResponse.json({ dashboard, audit });
    }

    return NextResponse.json({ error: 'unsupported role' }, { status: 400 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error('[GET /api/mobility-records]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
