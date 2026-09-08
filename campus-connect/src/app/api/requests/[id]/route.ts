import { NextResponse } from 'next/server';
import { updateRequestStatus } from '@/lib/db';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await updateRequestStatus(id, body.status);
    
    if (updated) {
      return NextResponse.json(updated);
    }
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
  }
}
