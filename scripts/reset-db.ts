/**
 * Reset Database Script
 * This script will:
 * 1. Drop all tables
 * 2. Recreate the database schema
 * 3. Optionally seed initial data
 * 
 * Run with: npx tsx scripts/reset-db.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Resetting database...\n");

  try {
    // Delete all data in reverse order of dependencies
    console.log("Deleting all data...");
    
    await prisma.attendance.deleteMany({});
    console.log("✓ Deleted all attendance records");
    
    await prisma.session.deleteMany({});
    console.log("✓ Deleted all sessions");
    
    await prisma.account.deleteMany({});
    console.log("✓ Deleted all accounts");
    
    await prisma.verificationToken.deleteMany({});
    console.log("✓ Deleted all verification tokens");
    
    await prisma.locationSetting.deleteMany({});
    console.log("✓ Deleted all location settings");
    
    await prisma.user.deleteMany({});
    console.log("✓ Deleted all users");
    
    console.log("\n✅ Database reset completed successfully!");
    console.log("\nNext steps:");
    console.log("1. Run migrations: npm run db:migrate");
    console.log("2. Or push schema: npm run db:push");
    console.log("3. Create admin user: npm run db:setup-admin");
    
  } catch (error) {
    console.error("\n❌ Error resetting database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
