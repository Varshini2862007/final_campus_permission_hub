import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/db';

export async function GET() {
  return NextResponse.json(getUsers());
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role, details } = body;
    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required user fields' }, { status: 400 });
    }

    const { saveUser, getUsers } = await import('@/lib/db');
    const existingUsers = getUsers(true);
    if (existingUsers.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const newUser = {
      id: role.toLowerCase().charAt(0) + '_' + crypto.randomUUID().slice(0, 8),
      name,
      email,
      password,
      role,
      avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(name)}`,
      details: details || `${role} - General`
    };

    const saved = saveUser(newUser);
    return NextResponse.json(saved, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
