/**
 * Complete Database Recreation Script
 * This script will:
 * 1. Reset the database (delete all data)
 * 2. Push the schema
 * 3. Optionally seed initial data
 * 
 * Run with: npx tsx scripts/recreate-db.ts
 */

import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Recreating database...\n");

  try {
    // Step 1: Reset database (delete all data)
    console.log("Step 1: Resetting database...");
    await prisma.attendance.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.account.deleteMany({});
    await prisma.verificationToken.deleteMany({});
    await prisma.locationSetting.deleteMany({});
    await prisma.user.deleteMany({});
    console.log("✓ All data deleted\n");

    // Step 2: Push schema
    console.log("Step 2: Pushing schema...");
    execSync("npx prisma db push --skip-generate", { stdio: "inherit" });
    console.log("✓ Schema pushed\n");

    // Step 3: Generate Prisma Client
    console.log("Step 3: Generating Prisma Client...");
    execSync("npx prisma generate", { stdio: "inherit" });
    console.log("✓ Prisma Client generated\n");

    console.log("✅ Database recreated successfully!");
    console.log("\nNext steps:");
    console.log("- Create admin user: npm run db:setup-admin");
    console.log("- Or seed sample data: npm run db:seed");
    
  } catch (error) {
    console.error("\n❌ Error recreating database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
