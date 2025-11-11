# Database Migration Guide

This guide explains how to apply database migrations for the backend.

## Quick Start

### Option 1: Using the Migration Script (Recommended)

1. **Stop the backend server** if it's running (press `Ctrl+C` in the terminal where it's running)

2. Run the migration script:
   ```powershell
   npm run migrate
   ```
   Or directly:
   ```powershell
   powershell -ExecutionPolicy Bypass -File ./migrate.ps1
   ```

### Option 2: Manual Migration

1. **Stop the backend server** if it's running

2. Generate Prisma Client:
   ```bash
   npm run prisma:generate
   ```
   Or:
   ```bash
   npx prisma generate
   ```

3. Apply database changes:
   ```bash
   npm run prisma:push
   ```
   Or:
   ```bash
   npx prisma db push
   ```

## Current Changes

The following fields have been added to the `User` model:
- `country` (String?, optional)
- `gender` (String?, optional)

## Troubleshooting

### Error: "database is locked"
- **Solution**: Stop the backend server and any other processes using the database (like Prisma Studio), then try again.

### Error: "EPERM: operation not permitted"
- **Solution**: The Prisma Client files are in use. Stop the backend server and try again.

### Error: "Prisma Client not found"
- **Solution**: Run `npm run prisma:generate` first to generate the Prisma Client.

## After Migration

Once the migration is complete:
1. Start the backend server: `npm run dev`
2. The new fields (`country` and `gender`) will be available in the User model
3. The `/api/auth/profile` PUT endpoint will accept these new fields for updates

## Verification

To verify the migration was successful:
1. Start Prisma Studio: `npm run prisma:studio`
2. Check the `User` table and verify the `country` and `gender` columns exist

