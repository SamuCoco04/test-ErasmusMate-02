import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '@/lib/errors';
import { socialMapQuerySchema } from '@/modules/social/schemas';
import { listSocialMapItems } from '@/modules/social/service';

export async function GET(request: NextRequest) {
  try {
    const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = socialMapQuerySchema.parse(raw);
    const items = await listSocialMapItems(parsed);
    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    if (error instanceof ZodError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('[GET /api/social/map/items]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
