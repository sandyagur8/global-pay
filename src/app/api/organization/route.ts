import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { name, ownerAddress } = await request.json();
    
    if (!name || !ownerAddress) {
      return NextResponse.json(
        { error: 'Name and owner address are required' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { walletAddress: ownerAddress },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user already has an organization
    const existingOrg = await prisma.organization.findUnique({
      where: { ownerId: user.id },
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: 'User already has an organization' },
        { status: 400 }
      );
    }

    // Create organization and update user to be employer
    const [organization] = await prisma.$transaction([
      prisma.organization.create({
        data: {
          name,
          ownerId: user.id,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { isEmployer: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        ownerId: organization.ownerId,
      },
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerAddress = searchParams.get('ownerAddress');
    
    if (!ownerAddress) {
      return NextResponse.json(
        { error: 'Owner address is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress: ownerAddress },
      include: { organization: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      organization: user.organization,
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    );
  }
}
