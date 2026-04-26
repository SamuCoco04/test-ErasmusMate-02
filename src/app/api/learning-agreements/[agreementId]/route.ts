import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/lib/errors';
import { getAgreementDetail } from '@/modules/learning-agreements/service';

export async function GET(request: NextRequest, { params }: { params: { agreementId: string } }) {
  const userId = request.nextUrl.searchParams.get('userId');

  try {
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    const agreement = await getAgreementDetail({ agreementId: params.agreementId, userId });
    return NextResponse.json({ agreement });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    console.error(`[GET /api/learning-agreements/${params.agreementId}]`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
