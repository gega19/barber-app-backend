/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `barbers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'BARBERSHOP';
ALTER TYPE "UserRole" ADD VALUE 'BARBER';

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "clientName" TEXT,
ADD COLUMN     "clientPhone" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "barbers" ADD COLUMN     "slug" TEXT,
ALTER COLUMN "rating" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "price" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "latitude" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "longitude" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "promotions" ALTER COLUMN "discount" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "discountAmount" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "services" ALTER COLUMN "price" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "workplaceId" TEXT;

-- AlterTable
ALTER TABLE "workplaces" ALTER COLUMN "rating" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "latitude" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "longitude" SET DATA TYPE DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "favorite_barbers" (
    "userId" TEXT NOT NULL,
    "barberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_barbers_pkey" PRIMARY KEY ("userId","barberId")
);

-- CreateIndex
CREATE UNIQUE INDEX "barbers_slug_key" ON "barbers"("slug");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_workplaceId_fkey" FOREIGN KEY ("workplaceId") REFERENCES "workplaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_barbers" ADD CONSTRAINT "favorite_barbers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_barbers" ADD CONSTRAINT "favorite_barbers_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "barbers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
