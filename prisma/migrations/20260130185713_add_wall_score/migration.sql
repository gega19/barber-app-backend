-- AlterTable
ALTER TABLE "barbers" ADD COLUMN     "wallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "wallScoreUpdatedAt" TIMESTAMP(3);
