import { NextRequest, NextResponse } from 'next/server';
import { userStorage } from '@/lib/user-storage';

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, userType, organizationName, displayName } = await request.json();
    
    if (!walletAddress || !userType) {
      return NextResponse.json(
        { error: 'Wallet address and user type are required' },
        { status: 400 }
      );
    }

    if (userType === 'EMPLOYER' && !organizationName) {
      return NextResponse.json(
        { error: 'Organization name is required for employers' },
        { status: 400 }
      );
    }

    // Create user and store
    const user = {
      id: 'user-' + Math.random().toString(36).substr(2, 9),
      walletAddress,
      userType: userType as 'EMPLOYER' | 'EMPLOYEE',
      hasOnboarded: true,
      organizationName: userType === 'EMPLOYER' ? organizationName : undefined,
      displayName,
      createdAt: new Date().toISOString(),
    };

    // Store user
    userStorage.setUser(walletAddress, user);

    return NextResponse.json({
      success: true,
      user: user,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}