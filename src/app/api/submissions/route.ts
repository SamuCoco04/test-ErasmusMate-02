import { NextRequest, NextResponse } from 'next/server';
import { createDraftSchema } from '@/modules/submissions/schemas';
import {
  createDraftSubmission,
  listProceduresForMobilityRecord,
  listReviewQueueForCoordinator,
  listSubmissionsForStudent
} from '@/modules/submissions/service';

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
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = createDraftSchema.parse(await request.json());
    const submission = await createDraftSubmission(parsed);
    return NextResponse.json({ submission }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
