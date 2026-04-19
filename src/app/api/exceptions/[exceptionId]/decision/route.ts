import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '@/lib/errors';
import { exceptionDecisionSchema } from '@/modules/exceptions/schemas';
import { transitionExceptionRequest } from '@/modules/exceptions/service';

export async function PATCH(request: NextRequest, { params }: { params: { exceptionId: string } }) {
  let body: unknown;

  try {
    body = await request.json();
    const payload = exceptionDecisionSchema.parse(body);
    const exception = await transitionExceptionRequest({
      exceptionId: params.exceptionId,
      userId: payload.userId,
      action: payload.action,
      rationale: payload.rationale
    });

    return NextResponse.json({ exception });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(`[PATCH /api/exceptions/${params.exceptionId}/decision]`, body, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
