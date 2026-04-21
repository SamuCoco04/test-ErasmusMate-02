import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/lib/errors';
import { listMapPlaceCatalog } from '@/modules/social/service';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    const places = await listMapPlaceCatalog(userId);
    return NextResponse.json({ places });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    console.error('[GET /api/social/map/places]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
