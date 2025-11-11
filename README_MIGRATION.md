# Quick Migration Guide

## ⚡ Quick Command

```powershell
npm run migrate
```

**IMPORTANT**: Make sure to stop the backend server first (Ctrl+C in the terminal where `npm run dev` is running).

## 📋 Step-by-Step Instructions

1. **Stop the backend server** (if running):
   - Go to the terminal where the server is running
   - Press `Ctrl+C` to stop it

2. **Run the migration**:
   ```powershell
   cd backend
   npm run migrate
   ```

3. **Restart the backend server**:
   ```powershell
   npm run dev
   ```

## ✅ What This Does

- Regenerates Prisma Client with the new `country` and `gender` fields
- Applies the database schema changes to your SQLite database
- Makes the new fields available in the API

## 🐛 If Something Goes Wrong

See `MIGRATION_GUIDE.md` for detailed troubleshooting steps.

