import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { username, accessCode } = await request.json();

    // Simple hardcoded authentication
    const validUsers = [
      { username: 'admin', code: 'ADMIN123', name: 'Administrator', role: 'admin' },
      { username: 'user1', code: 'USER123', name: 'Test User 1', role: 'user' },
      { username: 'user2', code: 'USER456', name: 'Test User 2', role: 'user' },
    ];

    const user = validUsers.find(u => u.username === username && u.code === accessCode);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or access code' },
        { status: 401 }
      );
    }

    // Create session
    const { data, error } = await supabase.auth.signInWithPassword({
      email: `${username}@example.com`,
      password: accessCode,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user?.id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: data.user?.email,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
