import { NextResponse } from 'next/server';
import { getMessages, saveMessage, updateMessage } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'message';
  const allMessages = await getMessages();
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
      likes: 0,
      likedBy: [],
      answers: 0,
      comments: [],
      ...data,
      timestamp: new Date().toISOString()
    };
    await saveMessage(newMsg);
    return NextResponse.json(newMsg);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, action, userId, comment } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    const allMessages = await getMessages();
    const current = allMessages.find((m: any) => m.id === id);
    if (!current) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    let updates: any = {};

    if (action === 'toggleLike') {
      const likedBy = Array.isArray(current.likedBy) ? [...current.likedBy] : [];
      const uid = userId || 'anonymous';
      const alreadyLiked = likedBy.includes(uid);
      
      let nextLikedBy: string[];
      let nextLikes: number;
      if (alreadyLiked) {
        nextLikedBy = likedBy.filter((u: string) => u !== uid);
        nextLikes = Math.max(0, (current.likes || 1) - 1);
      } else {
        nextLikedBy = [...likedBy, uid];
        nextLikes = (current.likes || 0) + 1;
      }
      updates = { likes: nextLikes, likedBy: nextLikedBy };
    } else if (action === 'addComment' && comment) {
      const existingComments = Array.isArray(current.comments) ? [...current.comments] : [];
      const newComment = {
        id: 'c_' + crypto.randomUUID(),
        text: comment.text,
        authorId: comment.authorId || userId || 'user',
        authorName: comment.authorName || 'Student',
        authorRole: comment.authorRole || 'Student',
        timestamp: new Date().toISOString()
      };
      existingComments.push(newComment);
      updates = {
        comments: existingComments,
        answers: existingComments.length
      };
    }

    const updated = await updateMessage(id, updates);
    return NextResponse.json(updated || { id, ...current, ...updates });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
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
    const deleted = await deleteMessage(id);
    if (deleted) {
      return NextResponse.json({ message: 'Deleted successfully' });
    }
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}

