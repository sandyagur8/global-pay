import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, userType, organizationName } = await request.json();
    
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

    // Find the user
    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.hasOnboarded) {
      return NextResponse.json(
        { error: 'User already onboarded' },
        { status: 400 }
      );
    }

    // Update user with onboarding info
    const updatedUser = await prisma.user.update({
      where: { walletAddress },
      data: {
        userType,
        hasOnboarded: true,
      },
    });

    let organizationData = null;

    // If employer, we'll need to create organization after contract deployment
    // For now, just mark as ready for organization creation
    if (userType === 'EMPLOYER') {
      organizationData = {
        name: organizationName,
        readyForDeployment: true,
      };
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        walletAddress: updatedUser.walletAddress,
        userType: updatedUser.userType,
        hasOnboarded: updatedUser.hasOnboarded,
      },
      organization: organizationData,
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
