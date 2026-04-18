import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { createDraftSchema } from '@/modules/submissions/schemas';
import {
  createDraftSubmission,
  listProceduresForMobilityRecord,
  listReviewQueueForCoordinator,
  listSubmissionsForStudent
} from '@/modules/submissions/service';
import { AppError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  const role = request.nextUrl.searchParams.get('role');
  const userId = request.nextUrl.searchParams.get('userId');
  const mobilityRecordId = request.nextUrl.searchParams.get('mobilityRecordId');

  try {
    if (!role || !userId) {
      return NextResponse.json({ error: 'role and userId are required' }, { status: 400 });
    }

    if (role === 'student') {
      const [submissions, procedures] = await Promise.all([
        listSubmissionsForStudent(userId),
        mobilityRecordId ? listProceduresForMobilityRecord(mobilityRecordId) : Promise.resolve([])
      ]);
      return NextResponse.json({ submissions, procedures });
    }

    if (role === 'coordinator') {
      const queue = await listReviewQueueForCoordinator(userId);
      return NextResponse.json({ queue });
    }

    return NextResponse.json({ error: 'unsupported role' }, { status: 400 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(`[GET /api/submissions] role=${role} userId=${userId}`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
    const parsed = createDraftSchema.parse(body);
    const submission = await createDraftSubmission(parsed);
    return NextResponse.json({ submission }, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('[POST /api/submissions]', body, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
