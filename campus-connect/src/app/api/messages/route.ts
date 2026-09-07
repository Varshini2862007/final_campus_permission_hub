import { NextResponse } from 'next/server';
import { getMessages, saveMessage } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'message';
  const allMessages = getMessages();
  return NextResponse.json(allMessages.filter((m: any) => m.type === type));
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (!data.text || !data.authorId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newMsg = {
      id: 'msg_' + crypto.randomUUID(),
      ...data,
      timestamp: new Date().toISOString()
    };
    saveMessage(newMsg);
    return NextResponse.json(newMsg);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    const { deleteMessage } = await import('@/lib/db');
    const deleted = deleteMessage(id);
    if (deleted) {
      return NextResponse.json({ message: 'Deleted successfully' });
    }
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
