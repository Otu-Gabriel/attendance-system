/**
 * Database Seed Script
 * Seeds the database with initial data for development/testing
 * 
 * Run with: npx tsx scripts/seed.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  try {
    // Create admin user
    const adminPassword = await bcrypt.hash("admin123", 12);
    const admin = await prisma.user.upsert({
      where: { email: "admin@example.com" },
      update: {},
      create: {
        email: "admin@example.com",
        name: "Admin User",
        password: adminPassword,
        role: "ADMIN",
        employeeId: "ADMIN001",
        department: "IT",
        position: "System Administrator",
      },
    });
    console.log("✓ Created admin user:", admin.email);

    // Create sample employees
    const employeePassword = await bcrypt.hash("employee123", 12);
    
    const employees = [
      {
        email: "john.doe@example.com",
        name: "John Doe",
        employeeId: "EMP001",
        department: "Engineering",
        position: "Software Engineer",
      },
      {
        email: "jane.smith@example.com",
        name: "Jane Smith",
        employeeId: "EMP002",
        department: "Marketing",
        position: "Marketing Manager",
      },
      {
        email: "bob.johnson@example.com",
        name: "Bob Johnson",
        employeeId: "EMP003",
        department: "Sales",
        position: "Sales Representative",
      },
    ];

    for (const emp of employees) {
      const employee = await prisma.user.upsert({
        where: { email: emp.email },
        update: {},
        create: {
          ...emp,
          password: employeePassword,
          role: "EMPLOYEE",
        },
      });
      console.log(`✓ Created employee: ${employee.name} (${employee.email})`);
    }

    // Create sample location setting
    const location = await prisma.locationSetting.upsert({
      where: { name: "Main Office" },
      update: {},
      create: {
        name: "Main Office",
        latitude: 40.7128, // Example: New York coordinates
        longitude: -74.0060,
        radius: 100.0,
        address: "123 Main Street, New York, NY 10001",
        isActive: true,
      },
    });
    console.log(`✓ Created location: ${location.name}`);

    // Create sample attendance records (last 7 days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const allEmployees = await prisma.user.findMany({
      where: { role: "EMPLOYEE" },
    });

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      for (const employee of allEmployees) {
        const checkIn = new Date(date);
        checkIn.setHours(9, 0, 0, 0);
        
        const checkOut = new Date(date);
        checkOut.setHours(17, 0, 0, 0);

        await prisma.attendance.upsert({
          where: {
            userId_date: {
              userId: employee.id,
              date: date,
            },
          },
          update: {},
          create: {
            userId: employee.id,
            date: date,
            checkIn: checkIn,
            checkOut: checkOut,
            status: "PRESENT",
            checkInLat: location.latitude,
            checkInLng: location.longitude,
            checkOutLat: location.latitude,
            checkOutLng: location.longitude,
          },
        });
      }
    }
    console.log("✓ Created sample attendance records (last 7 days)");

    console.log("\n✅ Database seeded successfully!");
    console.log("\nDefault credentials:");
    console.log("Admin: admin@example.com / admin123");
    console.log("Employee: john.doe@example.com / employee123");
    
  } catch (error) {
    console.error("\n❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
