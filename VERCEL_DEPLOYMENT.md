# Vercel Deployment Guide

## Prerequisites

1. **Database**: Set up a PostgreSQL database (recommended: Vercel Postgres, Supabase, or Railway)
2. **Environment Variables**: Configure all required environment variables in Vercel dashboard

## Required Environment Variables

Add these in your Vercel project settings (Settings → Environment Variables):

```env
DATABASE_URL="postgresql://user:password@host:5432/database"
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"
```

### Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

## Deployment Steps

1. **Push to GitHub**: Ensure your code is pushed to GitHub
2. **Import Project**: Import your GitHub repository in Vercel
3. **Configure Environment Variables**: Add all required env vars in Vercel dashboard
4. **Deploy**: Vercel will automatically build and deploy

## Build Process

The build script (`npm run build`) will:
1. Generate Prisma Client (`prisma generate`)
2. Build Next.js application (`next build`)

## Post-Deployment Steps

### 1. Run Database Migrations

After first deployment, run migrations to set up the database schema:

```bash
# Using Vercel CLI
vercel env pull .env.local
npx prisma migrate deploy

# Or using direct connection
DATABASE_URL="your-production-db-url" npx prisma migrate deploy
```

### 2. Download Face API Models

The Face API.js models need to be available in production. They should be committed to git in `public/models/` directory.

If models are missing, you can:
- Commit them to git (recommended)
- Or add a build step to download them

### 3. Create First Admin User

After deployment, create the first admin user:

```bash
# Using Vercel CLI
vercel env pull .env.local
npx tsx scripts/setup-admin.ts
```

Or manually create via database:

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

## Important Notes

1. **Face API Models**: Ensure `public/models/` directory with all model files is committed to git
2. **Database**: Use a production-ready PostgreSQL database (not SQLite)
3. **Environment Variables**: Never commit `.env` files - use Vercel environment variables
4. **Build Time**: First build may take longer due to Prisma Client generation

## Troubleshooting

### Build Fails
- Check that all environment variables are set
- Verify DATABASE_URL is correct
- Check build logs for specific errors

### Face Recognition Not Working
- Ensure `public/models/` directory exists with all model files
- Check browser console for model loading errors
- Verify models are accessible at `/models/` path

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check database allows connections from Vercel IPs
- Ensure SSL is configured if required

### Authentication Issues
- Verify NEXTAUTH_URL matches your deployment URL
- Check NEXTAUTH_SECRET is set
- Ensure callback URLs are configured correctly

## Production Checklist

- [ ] Database configured and accessible
- [ ] All environment variables set in Vercel
- [ ] Face API models committed to git
- [ ] Database migrations run
- [ ] First admin user created
- [ ] Location settings configured
- [ ] Test authentication flow
- [ ] Test face recognition
- [ ] Test geolocation verification
