import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '@/lib/errors';
import { createExceptionSchema } from '@/modules/exceptions/schemas';
import { createExceptionRequest, listExceptionsForRole } from '@/modules/exceptions/service';

export async function GET(request: NextRequest) {
  const role = request.nextUrl.searchParams.get('role') as 'student' | 'coordinator' | null;
  const userId = request.nextUrl.searchParams.get('userId');

  try {
    if (!role || !userId) {
      return NextResponse.json({ error: 'role and userId are required' }, { status: 400 });
    }

    const exceptions = await listExceptionsForRole({ role, userId });
    return NextResponse.json({ exceptions });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error('[GET /api/exceptions]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
    const payload = createExceptionSchema.parse(body);
    const exception = await createExceptionRequest(payload);
    return NextResponse.json({ exception }, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('[POST /api/exceptions]', body, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
