import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '@/lib/errors';
import {
  createSocialContentSchema,
  deleteSocialContentSchema,
  socialContentQuerySchema,
  updateSocialContentSchema
} from '@/modules/social/schemas';
import {
  createSocialContent,
  deleteSocialContent,
  listPlaceContexts,
  listSocialContent,
  updateSocialContent
} from '@/modules/social/service';

export async function GET(request: NextRequest) {
  try {
    const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = socialContentQuerySchema.parse(raw);
    const [items, places] = await Promise.all([
      listSocialContent(parsed),
      listPlaceContexts(parsed.userId)
    ]);
    return NextResponse.json({ items, places });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    if (error instanceof ZodError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('[GET /api/social/content]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
    const parsed = createSocialContentSchema.parse(body);
    const item = await createSocialContent(parsed);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    if (error instanceof ZodError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('[POST /api/social/content]', body, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
    const parsed = updateSocialContentSchema.parse(body);
    const item = await updateSocialContent(parsed);
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    if (error instanceof ZodError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('[PUT /api/social/content]', body, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
    const parsed = deleteSocialContentSchema.parse(body);
    const item = await deleteSocialContent(parsed.userId, parsed.contentId);
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    if (error instanceof ZodError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('[DELETE /api/social/content]', body, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
