import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '@/lib/errors';
import { favoriteSchema } from '@/modules/social/schemas';
import { listFavorites, setFavorite } from '@/modules/social/service';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

  try {
    const favorites = await listFavorites(userId);
    return NextResponse.json({ favorites });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    console.error('[GET /api/social/favorites]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
    const parsed = favoriteSchema.parse(body);
    const favorite = await setFavorite(parsed.userId, parsed.contentId, true);
    return NextResponse.json({ favorite }, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    if (error instanceof ZodError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('[POST /api/social/favorites]', body, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
    const parsed = favoriteSchema.parse(body);
    const favorite = await setFavorite(parsed.userId, parsed.contentId, false);
    return NextResponse.json({ favorite });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    if (error instanceof ZodError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('[DELETE /api/social/favorites]', body, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
