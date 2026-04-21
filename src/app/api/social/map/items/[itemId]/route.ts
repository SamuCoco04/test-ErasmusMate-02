import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/lib/errors';
import { getSocialMapItemDetail } from '@/modules/social/service';

export async function GET(request: NextRequest, { params }: { params: { itemId: string } }) {
  try {
    const userId = request.nextUrl.searchParams.get('userId') || '';
    const detail = await getSocialMapItemDetail(userId, params.itemId);
    return NextResponse.json({ detail });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    console.error('[GET /api/social/map/items/[itemId]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
