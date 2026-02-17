/**
 * Setup script to create the first admin user
 * Run with: npx tsx scripts/setup-admin.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import readline from "readline";

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log("=== Admin User Setup ===\n");

  const email = await question("Email: ");
  const name = await question("Name: ");
  const password = await question("Password: ");

  if (!email || !name || !password) {
    console.error("All fields are required!");
    process.exit(1);
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    console.log("\n✅ Admin user created successfully!");
    console.log(`Email: ${admin.email}`);
    console.log(`Name: ${admin.name}`);
    console.log(`Role: ${admin.role}`);
  } catch (error: any) {
    if (error.code === "P2002") {
      console.error("\n❌ Error: User with this email already exists!");
    } else {
      console.error("\n❌ Error creating admin user:", error);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

main();
