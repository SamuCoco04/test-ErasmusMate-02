import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/lib/errors';
import { getSubmissionDetailForCoordinator, listAuditRecordsForSubmission } from '@/modules/submissions/service';

export async function GET(
  request: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  const role = request.nextUrl.searchParams.get('role');
  const userId = request.nextUrl.searchParams.get('userId');

  try {
    if (!role || !userId) {
      return NextResponse.json({ error: 'role and userId are required' }, { status: 400 });
    }

    if (role !== 'coordinator') {
      return NextResponse.json({ error: 'Only coordinator detail path is supported' }, { status: 400 });
    }

    const submission = await getSubmissionDetailForCoordinator(params.submissionId, userId);
    const audit = await listAuditRecordsForSubmission(params.submissionId);

    return NextResponse.json({ submission, audit });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error(`[GET /api/submissions/${params.submissionId}] role=${role} userId=${userId}`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
