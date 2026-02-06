-- CreateEnum
CREATE TYPE "CompetitionPeriodStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');

-- CreateTable
CREATE TABLE "competition_periods" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "CompetitionPeriodStatus" NOT NULL DEFAULT 'DRAFT',
    "winnerBarberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competition_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barber_period_points" (
    "id" TEXT NOT NULL,
    "barberId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barber_period_points_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "competition_periods_status_idx" ON "competition_periods"("status");

-- CreateIndex
CREATE INDEX "competition_periods_startDate_endDate_idx" ON "competition_periods"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "barber_period_points_barberId_periodId_key" ON "barber_period_points"("barberId", "periodId");

-- CreateIndex
CREATE INDEX "barber_period_points_periodId_idx" ON "barber_period_points"("periodId");

-- CreateIndex
CREATE INDEX "barber_period_points_barberId_idx" ON "barber_period_points"("barberId");

-- AddForeignKey
ALTER TABLE "competition_periods" ADD CONSTRAINT "competition_periods_winnerBarberId_fkey" FOREIGN KEY ("winnerBarberId") REFERENCES "barbers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_period_points" ADD CONSTRAINT "barber_period_points_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "barbers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_period_points" ADD CONSTRAINT "barber_period_points_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "competition_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
