import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { transitionSchema } from '@/modules/submissions/schemas';
import { listAuditRecordsForSubmission, transitionSubmission } from '@/modules/submissions/service';
import { AppError } from '@/lib/errors';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  let body: unknown;
  try {
    body = await request.json();
    const payload = transitionSchema.parse(body);
    const submission = await transitionSubmission({
      submissionId: params.submissionId,
      userId: payload.userId,
      action: payload.action,
      rationale: payload.rationale
    });

    const audit = await listAuditRecordsForSubmission(params.submissionId);

    return NextResponse.json({ submission, audit });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(`[PATCH /api/submissions/${params.submissionId}/transition]`, body, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
