-- CreateEnum (if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CLIENT', 'USER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable: Convert role column from TEXT to UserRole enum
-- First, ensure all existing values are valid enum values
UPDATE "users" SET "role" = 'USER' WHERE "role" NOT IN ('ADMIN', 'CLIENT', 'USER');

-- Now alter the column type
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole" USING "role"::"UserRole";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER';

