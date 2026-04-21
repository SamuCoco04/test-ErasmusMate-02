import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '@/lib/errors';
import { sendMessageSchema } from '@/modules/social/schemas';
import { listMessages, sendMessage } from '@/modules/social/service';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  const connectionId = request.nextUrl.searchParams.get('connectionId');
  if (!userId || !connectionId) return NextResponse.json({ error: 'userId and connectionId are required' }, { status: 400 });

  try {
    const messages = await listMessages(userId, connectionId);
    return NextResponse.json({ messages });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    console.error('[GET /api/social/messages]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
    const parsed = sendMessageSchema.parse(body);
    const message = await sendMessage(parsed);
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    if (error instanceof ZodError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('[POST /api/social/messages]', body, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
