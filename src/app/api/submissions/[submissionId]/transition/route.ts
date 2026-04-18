import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { transitionSchema } from '@/modules/submissions/schemas';
import { listAuditRecordsForSubmission, transitionSubmission } from '@/modules/submissions/service';
import { AuthorizationError, NotFoundError } from '@/modules/submissions/errors';

function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (error instanceof AuthorizationError) {
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }
  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: (error as Error).message }, { status: 404 });
  }
  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  try {
    const payload = transitionSchema.parse(await request.json());
    const submission = await transitionSubmission({
      submissionId: params.submissionId,
      userId: payload.userId,
      action: payload.action,
      rationale: payload.rationale
    });

    const audit = await listAuditRecordsForSubmission(params.submissionId);

    return NextResponse.json({ submission, audit });
  } catch (error) {
    return errorResponse(error);
  }
}
