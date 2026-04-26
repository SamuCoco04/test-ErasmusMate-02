import { NextResponse, NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '@/lib/errors';
import { removeRowSchema, updateRowSchema } from '@/modules/learning-agreements/schemas';
import { removeAgreementRow, updateAgreementRow } from '@/modules/learning-agreements/service';

export async function PATCH(request: NextRequest, { params }: { params: { agreementId: string; rowId: string } }) {
  let body: unknown;
  try {
    body = await request.json();
    const payload = updateRowSchema.parse(body);
    const row = await updateAgreementRow({
      agreementId: params.agreementId,
      rowId: params.rowId,
      userId: payload.userId,
      row: payload.row
    });
    return NextResponse.json({ row });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    if (error instanceof ZodError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error(`[PATCH /api/learning-agreements/${params.agreementId}/rows/${params.rowId}]`, body, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { agreementId: string; rowId: string } }) {
  let body: unknown;
  try {
    body = await request.json();
    const payload = removeRowSchema.parse(body);
    await removeAgreementRow({ agreementId: params.agreementId, rowId: params.rowId, userId: payload.userId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    if (error instanceof ZodError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error(`[DELETE /api/learning-agreements/${params.agreementId}/rows/${params.rowId}]`, body, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
