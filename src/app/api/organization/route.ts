import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { name, ownerAddress, contractAddress, paymentToken } = await request.json();
    
    if (!name || !ownerAddress || !contractAddress || !paymentToken) {
      return NextResponse.json(
        { error: 'Name, owner address, contract address, and payment token are required' },
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

    if (user.userType !== 'EMPLOYER') {
      return NextResponse.json(
        { error: 'User is not an employer' },
        { status: 400 }
      );
    }

    // Check if contract address is already used
    const existingOrg = await prisma.organization.findUnique({
      where: { contractAddress },
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: 'Contract address already in use' },
        { status: 400 }
      );
    }

    // Create organization
    const organization = await prisma.organization.create({
      data: {
        name,
        contractAddress,
        ownerId: user.id,
        paymentToken,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        contractAddress: organization.contractAddress,
        ownerId: organization.ownerId,
        paymentToken: organization.paymentToken,
        isActive: organization.isActive,
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
      include: { 
        organizations: {
          where: { isActive: true },
          include: {
            employees: {
              where: { isActive: true }
            }
          }
        }
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      organizations: user.organizations,
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}
