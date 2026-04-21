import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/lib/errors';
import { listMapPlaceCatalog } from '@/modules/social/service';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId') || '';
    const places = await listMapPlaceCatalog(userId);
    return NextResponse.json({ places });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    console.error('[GET /api/social/map/places]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
