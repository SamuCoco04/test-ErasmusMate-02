import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '@/lib/errors';
import { connectionActionSchema, createConnectionSchema } from '@/modules/social/schemas';
import { actOnConnection, createConnectionRequest, listConnections } from '@/modules/social/service';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

  try {
    const connections = await listConnections(userId);
    return NextResponse.json({ connections });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    console.error('[GET /api/social/connections]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
    const parsed = createConnectionSchema.parse(body);
    const connection = await createConnectionRequest(parsed.userId, parsed.targetProfileId);
    return NextResponse.json({ connection }, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    if (error instanceof ZodError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('[POST /api/social/connections]', body, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const connectionId = request.nextUrl.searchParams.get('connectionId');
  if (!connectionId) return NextResponse.json({ error: 'connectionId is required' }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
    const parsed = connectionActionSchema.parse(body);
    const connection = await actOnConnection(connectionId, parsed.userId, parsed.action);
    return NextResponse.json({ connection });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    if (error instanceof ZodError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('[PATCH /api/social/connections]', body, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
