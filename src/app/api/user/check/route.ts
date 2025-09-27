import { NextRequest, NextResponse } from 'next/server';
import { userStorage } from '@/lib/user-storage';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    
    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    // Check if user exists in our storage
    const user = userStorage.getUser(address);
    
    if (user) {
      return NextResponse.json({
        exists: true,
        user: user,
      });
    } else {
      return NextResponse.json({
        exists: false,
        user: null,
      });
    }
  } catch (error) {
    console.error('Error checking user:', error);
    return NextResponse.json(
      { error: 'Failed to check user' },
      { status: 500 }
    );
  }
}