import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const {
      organizationId,
      employeeAddress,
      amountPerSecond,
      startTime,
      stopTime,
    } = await request.json();
    
    if (!organizationId || !employeeAddress || !amountPerSecond) {
      return NextResponse.json(
        { error: 'Organization ID, employee address, and amount per second are required' },
        { status: 400 }
      );
    }

    // Verify organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Create payment stream
    const stream = await prisma.paymentStream.create({
      data: {
        organizationId,
        employeeAddress,
        amountPerSecond: BigInt(amountPerSecond),
        startTime: new Date(startTime),
        stopTime: stopTime ? new Date(stopTime) : null,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      stream: {
        id: stream.id,
        organizationId: stream.organizationId,
        employeeAddress: stream.employeeAddress,
        amountPerSecond: stream.amountPerSecond.toString(),
        startTime: stream.startTime,
        stopTime: stream.stopTime,
        isActive: stream.isActive,
      },
    });
  } catch (error) {
    console.error('Error creating stream:', error);
    return NextResponse.json(
      { error: 'Failed to create stream' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const employeeAddress = searchParams.get('employeeAddress');
    
    let streams;
    
    if (organizationId) {
      // Get streams for an organization (employer view)
      streams = await prisma.paymentStream.findMany({
        where: { organizationId },
        include: {
          organization: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (employeeAddress) {
      // Get streams for an employee
      streams = await prisma.paymentStream.findMany({
        where: { employeeAddress },
        include: {
          organization: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      return NextResponse.json(
        { error: 'Either organizationId or employeeAddress is required' },
        { status: 400 }
      );
    }

    // Convert BigInt to string for JSON serialization
    const serializedStreams = streams.map(stream => ({
      ...stream,
      amountPerSecond: stream.amountPerSecond.toString(),
      totalFunded: stream.totalFunded.toString(),
      totalWithdrawn: stream.totalWithdrawn.toString(),
    }));

    return NextResponse.json({
      success: true,
      streams: serializedStreams,
    });
  } catch (error) {
    console.error('Error fetching streams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch streams' },
      { status: 500 }
    );
  }
}
