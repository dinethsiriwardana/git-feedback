import { NextRequest, NextResponse } from 'next/server';
import { toggleLike } from '@/lib/db';

export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/feedback/[id]/like'>
) {
  try {
    const { id } = await ctx.params;
    const { visitorId } = await request.json();

    if (!visitorId) {
      return NextResponse.json({ error: 'visitorId is required' }, { status: 400 });
    }

    const result = await toggleLike(id, visitorId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error toggling like:', error);
    return NextResponse.json({ error: 'Failed to update like status' }, { status: 500 });
  }
}
