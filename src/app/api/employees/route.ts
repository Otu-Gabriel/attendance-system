import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { descriptorToString } from "@/lib/face-recognition";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department");

    const where: any = {
      role: "EMPLOYEE",
    };

    if (department) {
      where.department = department;
    }

    const employees = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        employeeId: true,
        department: true,
        position: true,
        isActive: true,
        faceImageUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ employees });
  } catch (error) {
    console.error("Get employees error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      email,
      name,
      password,
      employeeId,
      department,
      position,
      faceDescriptor,
      faceImageUrl,
    } = await req.json();

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "Email, name, and password are required" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const employee = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: "EMPLOYEE",
        employeeId: employeeId || null,
        department: department || null,
        position: position || null,
        faceDescriptor: faceDescriptor ? descriptorToString(new Float32Array(faceDescriptor)) : null,
        faceImageUrl: faceImageUrl || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        employeeId: true,
        department: true,
        position: true,
      },
    });

    return NextResponse.json({ employee });
  } catch (error: any) {
    console.error("Create employee error:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Email or employee ID already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      id,
      email,
      name,
      password,
      employeeId,
      department,
      position,
      faceDescriptor,
      faceImageUrl,
      isActive,
    } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (password) updateData.password = await bcrypt.hash(password, 12);
    if (employeeId !== undefined) updateData.employeeId = employeeId;
    if (department !== undefined) updateData.department = department;
    if (position !== undefined) updateData.position = position;
    if (faceDescriptor)
      updateData.faceDescriptor = descriptorToString(
        new Float32Array(faceDescriptor)
      );
    if (faceImageUrl !== undefined) updateData.faceImageUrl = faceImageUrl;
    if (isActive !== undefined) updateData.isActive = isActive;

    const employee = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        employeeId: true,
        department: true,
        position: true,
        isActive: true,
      },
    });

    return NextResponse.json({ employee });
  } catch (error) {
    console.error("Update employee error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete employee error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
