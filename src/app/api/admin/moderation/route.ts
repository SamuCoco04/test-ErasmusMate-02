import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '@/lib/errors';
import { moderationActionSchema, moderationQueueQuerySchema } from '@/modules/social/schemas';
import { applyModerationAction, listModerationQueue } from '@/modules/social/service';

export async function GET(request: NextRequest) {
  try {
    const parsed = moderationQueueQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));
    const queue = await listModerationQueue(parsed);
    return NextResponse.json({ queue });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    if (error instanceof ZodError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('[GET /api/admin/moderation]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
    const parsed = moderationActionSchema.parse(body);
    const moderationCase = await applyModerationAction(parsed);
    return NextResponse.json({ moderationCase });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    if (error instanceof ZodError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('[PATCH /api/admin/moderation]', body, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
