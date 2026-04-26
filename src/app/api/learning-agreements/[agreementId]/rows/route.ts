import { NextResponse, NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '@/lib/errors';
import { addRowSchema } from '@/modules/learning-agreements/schemas';
import { addAgreementRow } from '@/modules/learning-agreements/service';

export async function POST(request: NextRequest, { params }: { params: { agreementId: string } }) {
  let body: unknown;
  try {
    body = await request.json();
    const payload = addRowSchema.parse(body);
    const row = await addAgreementRow({ agreementId: params.agreementId, userId: payload.userId, row: payload.row });
    return NextResponse.json({ row }, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    if (error instanceof ZodError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error(`[POST /api/learning-agreements/${params.agreementId}/rows]`, body, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
