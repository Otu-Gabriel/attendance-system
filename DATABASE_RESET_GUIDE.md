# Database Reset & Recreation Guide

This guide explains how to reset, recreate, or reseed your database.

## Quick Commands

### Reset Database (Delete All Data)
```bash
npm run db:reset
```
This will delete all data but keep the schema intact.

### Recreate Database (Reset + Push Schema)
```bash
npm run db:recreate
```
This will:
1. Delete all data
2. Push the schema
3. Regenerate Prisma Client

### Seed Database (Add Sample Data)
```bash
npm run db:seed
```
This will add:
- Admin user (admin@example.com / admin123)
- Sample employees
- Sample location settings
- Sample attendance records (last 7 days)

### Create Admin User Only
```bash
npm run db:setup-admin
```
Interactive script to create an admin user.

## Complete Reset & Reseed Workflow

### Option 1: Complete Fresh Start
```bash
# 1. Reset and recreate database
npm run db:recreate

# 2. Seed with sample data
npm run db:seed
```

### Option 2: Reset Only (Keep Schema)
```bash
# 1. Reset database (delete all data)
npm run db:reset

# 2. Create admin user
npm run db:setup-admin
```

### Option 3: Using Migrations
```bash
# 1. Reset database
npm run db:reset

# 2. Run migrations
npm run db:migrate

# 3. Seed data (optional)
npm run db:seed
```

## Manual Reset (Using Prisma Studio)

1. Open Prisma Studio:
   ```bash
   npm run db:studio
   ```

2. Manually delete records from each table:
   - Attendance
   - Session
   - Account
   - VerificationToken
   - LocationSetting
   - User

## Using SQL (Direct Database Access)

If you have direct database access, you can reset using SQL:

```sql
-- Delete all data (in order of dependencies)
DELETE FROM "Attendance";
DELETE FROM "Session";
DELETE FROM "Account";
DELETE FROM "VerificationToken";
DELETE FROM "LocationSetting";
DELETE FROM "User";
```

## Seed Data Details

The seed script (`npm run db:seed`) creates:

### Admin User
- Email: `admin@example.com`
- Password: `admin123`
- Role: ADMIN

### Sample Employees
- `john.doe@example.com` / `employee123` - Engineering
- `jane.smith@example.com` / `employee123` - Marketing
- `bob.johnson@example.com` / `employee123` - Sales

### Sample Location
- Name: "Main Office"
- Coordinates: 40.7128, -74.0060 (New York)
- Radius: 100 meters

### Sample Attendance
- Last 7 days of attendance records
- Check-in: 9:00 AM
- Check-out: 5:00 PM

## Important Notes

⚠️ **Warning**: These commands will DELETE ALL DATA. Use with caution!

- Always backup your database before resetting in production
- Reset commands are safe for development
- Seed data is for development/testing only
- Change default passwords after seeding

## Troubleshooting

### Error: "Cannot delete due to foreign key constraints"
Run the reset script which deletes in the correct order, or use `npm run db:recreate`.

### Error: "Schema is out of sync"
Run `npm run db:push` or `npm run db:migrate` to sync the schema.

### Error: "Prisma Client not generated"
Run `npm run db:generate` after resetting.

## Production Reset

For production environments:

1. **Backup first**:
   ```bash
   pg_dump your_database > backup.sql
   ```

2. **Reset carefully**:
   ```bash
   npm run db:reset
   npm run db:migrate deploy
   ```

3. **Create admin user**:
   ```bash
   npm run db:setup-admin
   ```
