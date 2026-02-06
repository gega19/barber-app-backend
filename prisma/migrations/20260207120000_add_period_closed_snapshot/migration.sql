-- AlterTable
ALTER TABLE "competition_periods" ADD COLUMN "closedAt" TIMESTAMP(3),
ADD COLUMN "finalStandingsSnapshot" JSONB;
