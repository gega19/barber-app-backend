-- CreateTable
CREATE TABLE IF NOT EXISTS "campaigns" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetUserIds" JSONB,
    "sentAt" TIMESTAMP(3),
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "campaigns_targetType_idx" ON "campaigns"("targetType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "campaigns_createdAt_idx" ON "campaigns"("createdAt");

