import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '@/lib/errors';
import { createAgreementSchema } from '@/modules/learning-agreements/schemas';
import { createOrGetDraftAgreement, listCoordinatorReviewQueue } from '@/modules/learning-agreements/service';

export async function GET(request: NextRequest) {
  const role = request.nextUrl.searchParams.get('role');
  const userId = request.nextUrl.searchParams.get('userId');

  try {
    if (!role || !userId) {
      return NextResponse.json({ error: 'role and userId are required' }, { status: 400 });
    }

    if (role === 'coordinator') {
      const queue = await listCoordinatorReviewQueue(userId);
      return NextResponse.json({ queue });
    }

    return NextResponse.json({ error: 'unsupported role' }, { status: 400 });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    console.error('[GET /api/learning-agreements]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
    const parsed = createAgreementSchema.parse(body);
    const agreement = await createOrGetDraftAgreement(parsed);
    return NextResponse.json({ agreement }, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    if (error instanceof ZodError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('[POST /api/learning-agreements]', body, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
