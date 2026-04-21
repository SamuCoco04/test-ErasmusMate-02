import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { discoveryQuerySchema } from '@/modules/social/schemas';
import { discoverStudents } from '@/modules/social/service';
import { AppError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const parsed = discoveryQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));
    const results = await discoverStudents(parsed);
    return NextResponse.json({ results });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    if (error instanceof ZodError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('[GET /api/social/discover]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
