import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { decideRowSchema } from '@/modules/learning-agreements/schemas';
import { AppError } from '@/lib/errors';
import { decideAgreementRow } from '@/modules/learning-agreements/service';

export async function POST(request: NextRequest, { params }: { params: { agreementId: string; rowId: string } }) {
  let body: unknown;
  try {
    body = await request.json();
    const payload = decideRowSchema.parse(body);
    await decideAgreementRow({
      agreementId: params.agreementId,
      rowId: params.rowId,
      userId: payload.userId,
      decision: payload.decision,
      rationale: payload.rationale,
      grade: payload.grade
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    if (error instanceof ZodError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error(`[POST /api/learning-agreements/${params.agreementId}/rows/${params.rowId}/decision]`, body, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
