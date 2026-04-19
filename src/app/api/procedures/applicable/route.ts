import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/lib/errors';
import { listApplicableProceduresForMobilityRecord } from '@/modules/institutional/service';

export async function GET(request: NextRequest) {
  const mobilityRecordId = request.nextUrl.searchParams.get('mobilityRecordId');

  try {
    if (!mobilityRecordId) {
      return NextResponse.json({ error: 'mobilityRecordId is required' }, { status: 400 });
    }

    const procedures = await listApplicableProceduresForMobilityRecord(mobilityRecordId);
    return NextResponse.json({ procedures });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error('[GET /api/procedures/applicable]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
