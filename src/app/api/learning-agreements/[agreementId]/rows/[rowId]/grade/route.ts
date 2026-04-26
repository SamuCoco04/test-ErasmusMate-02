import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { updateRowGradeSchema } from '@/modules/learning-agreements/schemas';
import { AppError } from '@/lib/errors';
import { updateAgreementRowGrade } from '@/modules/learning-agreements/service';

export async function PATCH(request: NextRequest, { params }: { params: { agreementId: string; rowId: string } }) {
  let body: unknown;
  try {
    body = await request.json();
    const payload = updateRowGradeSchema.parse(body);
    const row = await updateAgreementRowGrade({
      agreementId: params.agreementId,
      rowId: params.rowId,
      userId: payload.userId,
      grade: payload.grade
    });
    return NextResponse.json({ row });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    if (error instanceof ZodError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error(`[PATCH /api/learning-agreements/${params.agreementId}/rows/${params.rowId}/grade]`, body, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
