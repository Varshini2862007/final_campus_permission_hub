import { NextResponse } from 'next/server';
import { getFacultyRequests, saveFacultyRequest } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getFacultyRequests());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newRequest = {
      id: "fac_req_" + crypto.randomUUID(),
      ...body,
      status: "Pending",
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      priority: body.priority || "Medium"
    };
    
    saveFacultyRequest(newRequest);
    return NextResponse.json(newRequest);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create faculty request' }, { status: 500 });
  }
}
