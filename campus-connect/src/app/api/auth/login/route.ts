import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, role } = body;

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const allUsers = getUsers(true);
    const user = allUsers.find(
      (u: any) => u.email === email && u.password === password && u.role === role
    );

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials or role' }, { status: 401 });
    }

    // In a real app, you would set a secure HttpOnly cookie here with a JWT token.
    // For this mockup, we'll just return the user data to the client.
    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        details: user.details
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
