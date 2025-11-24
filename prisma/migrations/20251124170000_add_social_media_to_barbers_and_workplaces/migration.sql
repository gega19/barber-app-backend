-- AlterTable: Add social media fields to barbers
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "instagramUrl" TEXT;
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "tiktokUrl" TEXT;

-- AlterTable: Add social media fields to workplaces
ALTER TABLE "workplaces" ADD COLUMN IF NOT EXISTS "instagramUrl" TEXT;
ALTER TABLE "workplaces" ADD COLUMN IF NOT EXISTS "tiktokUrl" TEXT;

