import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { 
      organizationId, 
      employeeAddress, 
      name, 
      salaryPerSecond 
    } = await request.json();
    
    if (!organizationId || !employeeAddress || !salaryPerSecond) {
      return NextResponse.json(
        { error: 'Organization ID, employee address, and salary per second are required' },
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

    // Check if employee already exists in this organization
    const existingEmployee = await prisma.employee.findUnique({
      where: {
        organizationId_employeeAddress: {
          organizationId,
          employeeAddress,
        },
      },
    });

    if (existingEmployee && existingEmployee.isActive) {
      return NextResponse.json(
        { error: 'Employee already exists in this organization' },
        { status: 400 }
      );
    }

    // Create or reactivate employee
    const employee = existingEmployee
      ? await prisma.employee.update({
          where: { id: existingEmployee.id },
          data: {
            name,
            salaryPerSecond: BigInt(salaryPerSecond),
            isActive: true,
            startDate: new Date(),
          },
        })
      : await prisma.employee.create({
          data: {
            organizationId,
            employeeAddress,
            name,
            salaryPerSecond: BigInt(salaryPerSecond),
            startDate: new Date(),
            isActive: true,
          },
        });

    return NextResponse.json({
      success: true,
      employee: {
        id: employee.id,
        organizationId: employee.organizationId,
        employeeAddress: employee.employeeAddress,
        name: employee.name,
        salaryPerSecond: employee.salaryPerSecond.toString(),
        startDate: employee.startDate,
        isActive: employee.isActive,
      },
    });
  } catch (error) {
    console.error('Error adding employee:', error);
    return NextResponse.json(
      { error: 'Failed to add employee' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const employeeAddress = searchParams.get('employeeAddress');
    
    if (!organizationId && !employeeAddress) {
      return NextResponse.json(
        { error: 'Either organizationId or employeeAddress is required' },
        { status: 400 }
      );
    }

    let employees;
    
    if (organizationId) {
      // Get employees for an organization
      employees = await prisma.employee.findMany({
        where: { 
          organizationId,
          isActive: true 
        },
        include: {
          organization: {
            select: { 
              name: true, 
              contractAddress: true,
              paymentToken: true 
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (employeeAddress) {
      // Get organizations where this address is an employee
      employees = await prisma.employee.findMany({
        where: { 
          employeeAddress,
          isActive: true 
        },
        include: {
          organization: {
            select: { 
              name: true, 
              contractAddress: true,
              paymentToken: true 
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Convert BigInt to string for JSON serialization
    const serializedEmployees = employees?.map(employee => ({
      ...employee,
      salaryPerSecond: employee.salaryPerSecond.toString(),
    }));

    return NextResponse.json({
      success: true,
      employees: serializedEmployees,
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { employeeId, salaryPerSecond, name } = await request.json();
    
    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (salaryPerSecond !== undefined) {
      updateData.salaryPerSecond = BigInt(salaryPerSecond);
    }
    if (name !== undefined) {
      updateData.name = name;
    }

    const employee = await prisma.employee.update({
      where: { id: employeeId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      employee: {
        ...employee,
        salaryPerSecond: employee.salaryPerSecond.toString(),
      },
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json(
      { error: 'Failed to update employee' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    
    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.update({
      where: { id: employeeId },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Employee removed successfully',
    });
  } catch (error) {
    console.error('Error removing employee:', error);
    return NextResponse.json(
      { error: 'Failed to remove employee' },
      { status: 500 }
    );
  }
}
