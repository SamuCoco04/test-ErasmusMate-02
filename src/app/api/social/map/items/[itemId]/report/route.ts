import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '@/lib/errors';
import { socialMapReportSchema } from '@/modules/social/schemas';
import { getSocialMapItemDetail, reportSocialContent } from '@/modules/social/service';

export async function POST(request: NextRequest, { params }: { params: { itemId: string } }) {
  let body: unknown;
  try {
    body = await request.json();
    const parsed = socialMapReportSchema.parse(body);
    const content = await getSocialMapItemDetail(parsed.userId, params.itemId);
    const result = await reportSocialContent({
      userId: parsed.userId,
      targetType: content.kind as 'recommendation' | 'tip' | 'review' | 'opinion',
      targetContentId: content.id,
      reportReason: parsed.reportReason,
      reportDetails: parsed.reportDetails
    });

    return NextResponse.json({ result }, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    if (error instanceof ZodError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('[POST /api/social/map/items/[itemId]/report]', body, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
