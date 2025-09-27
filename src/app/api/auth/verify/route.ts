import { SiweMessage } from 'siwe';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { message, signature } = await request.json();
    
    if (!message || !signature) {
      return NextResponse.json(
        { error: 'Message and signature are required' },
        { status: 400 }
      );
    }

    const siweMessage = new SiweMessage(message);
    const fields = await siweMessage.verify({ signature });

    if (!fields.success) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const walletAddress = siweMessage.address;

    // Create or update user in database
    const user = await prisma.user.upsert({
      where: { walletAddress },
      update: { updatedAt: new Date() },
      create: {
        walletAddress,
        isEmployer: false, // Default to employee, can be changed later
      },
    });

    // In a production app, you'd create a session here
    // For now, we'll just return the user data
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        isEmployer: user.isEmployer,
      },
    });
  } catch (error) {
    console.error('Error verifying signature:', error);
    return NextResponse.json(
      { error: 'Failed to verify signature' },
      { status: 500 }
    );
  }
}
