import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/lib/errors';
import { getAcademicSummary } from '@/modules/learning-agreements/service';

export async function GET(request: NextRequest, { params }: { params: { mobilityRecordId: string } }) {
  const userId = request.nextUrl.searchParams.get('userId');
  try {
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    const summary = await getAcademicSummary({ mobilityRecordId: params.mobilityRecordId, userId });
    return NextResponse.json({ summary });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    console.error(`[GET /api/mobility-records/${params.mobilityRecordId}/academic-summary]`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
