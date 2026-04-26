import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { transitionAgreementSchema } from '@/modules/learning-agreements/schemas';
import { AppError } from '@/lib/errors';
import { resubmitAgreement } from '@/modules/learning-agreements/service';

export async function POST(request: NextRequest, { params }: { params: { agreementId: string } }) {
  let body: unknown;
  try {
    body = await request.json();
    const payload = transitionAgreementSchema.parse(body);
    const agreement = await resubmitAgreement({ agreementId: params.agreementId, userId: payload.userId });
    return NextResponse.json({ agreement });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    if (error instanceof ZodError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error(`[POST /api/learning-agreements/${params.agreementId}/resubmit]`, body, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
