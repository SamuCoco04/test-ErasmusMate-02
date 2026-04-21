import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '@/lib/errors';
import { socialProfileSchema } from '@/modules/social/schemas';
import { getOrCreateSocialProfile, upsertSocialProfile } from '@/modules/social/service';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

  try {
    const profile = await getOrCreateSocialProfile(userId);
    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    console.error('[GET /api/social/profile]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
    const parsed = socialProfileSchema.parse(body);
    const profile = await upsertSocialProfile(parsed);
    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    if (error instanceof ZodError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('[PUT /api/social/profile]', body, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
