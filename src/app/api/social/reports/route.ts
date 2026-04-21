import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '@/lib/errors';
import { reportContentSchema } from '@/modules/social/schemas';
import { reportSocialContent } from '@/modules/social/service';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
    const parsed = reportContentSchema.parse(body);
    const result = await reportSocialContent(parsed);
    return NextResponse.json({ result }, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    if (error instanceof ZodError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('[POST /api/social/reports]', body, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
