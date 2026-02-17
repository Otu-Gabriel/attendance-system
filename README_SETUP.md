# Attendance System Setup Guide

## Prerequisites

- Node.js 20+ installed
- PostgreSQL database running
- npm or yarn package manager

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/attendance_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"
```

Generate a secret key:
```bash
openssl rand -base64 32
```

### 3. Set Up Database

Run Prisma migrations:

```bash
npm run db:migrate
```

Or push the schema directly:

```bash
npm run db:push
```

### 4. Download Face API.js Models

Download the Face API.js model files using the provided script:

**Using npm script (recommended):**
```bash
npm run download-models
```

**Or manually using Node.js:**
```bash
node scripts/download-models.js
```

**Or using PowerShell (Windows):**
```powershell
.\scripts\download-models.ps1
```

The script will automatically:
- Create the `public/models` directory
- Download all required model files:
  - `tiny_face_detector_model-weights_manifest.json`
  - `tiny_face_detector_model-shard1`
  - `face_landmark_68_model-weights_manifest.json`
  - `face_landmark_68_model-shard1`
  - `face_recognition_model-weights_manifest.json`
  - `face_recognition_model-shard1`
  - `face_recognition_model-shard2`

### 5. Create First Admin User

Run the setup script:

```bash
npx tsx scripts/setup-admin.ts
```

Or manually create an admin user in the database:

```sql
INSERT INTO "User" (id, email, name, password, role, "createdAt", "updatedAt")
VALUES (
  'admin-id',
  'admin@example.com',
  'Admin User',
  '$2a$12$hashedpasswordhere', -- Use bcrypt to hash password
  'ADMIN',
  NOW(),
  NOW()
);
```

### 6. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000 and login with your admin credentials.

## Features

### Admin Features
- Create and manage employees
- Register employee faces
- Configure allowed locations for attendance
- View all attendance records
- Export attendance reports (CSV)
- View dashboard with statistics

### Employee Features
- Mark attendance using facial recognition
- Geolocation verification before marking attendance
- View personal attendance history
- View today's attendance status

## Usage

1. **Admin Setup**:
   - Login as admin
   - Go to Settings → Location Settings
   - Add allowed locations with coordinates and radius
   - Go to Employees → Add Employee
   - Register employee face during creation

2. **Employee Attendance**:
   - Employee logs in
   - Goes to Mark Attendance page
   - System verifies location
   - Employee captures face
   - System verifies face match
   - Attendance is recorded

## Troubleshooting

### Face Recognition Not Working
- Ensure Face API.js models are in `public/models`
- Check browser console for errors
- Ensure camera permissions are granted

### Geolocation Not Working
- Ensure location permissions are granted
- Check that location settings are configured in admin panel
- Verify coordinates are correct

### Database Connection Issues
- Check DATABASE_URL in .env
- Ensure PostgreSQL is running
- Run `npm run db:push` to sync schema

## Production Deployment

1. Set up production database
2. Update DATABASE_URL in environment variables
3. Set NEXTAUTH_URL to your production domain
4. Generate new NEXTAUTH_SECRET
5. Build the application:
   ```bash
   npm run build
   ```
6. Start the production server:
   ```bash
   npm start
   ```

## Security Notes

- Change default admin password immediately
- Use strong NEXTAUTH_SECRET in production
- Enable HTTPS in production
- Regularly backup database
- Review and update dependencies regularly
