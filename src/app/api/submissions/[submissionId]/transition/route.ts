import { NextRequest, NextResponse } from 'next/server';
import { transitionSchema } from '@/modules/submissions/schemas';
import { listAuditRecordsForSubmission, transitionSubmission } from '@/modules/submissions/service';

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
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
