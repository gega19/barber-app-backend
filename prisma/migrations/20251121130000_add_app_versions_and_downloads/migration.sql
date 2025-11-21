-- CreateTable
CREATE TABLE IF NOT EXISTS "app_versions" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "versionCode" INTEGER NOT NULL,
    "apkUrl" TEXT NOT NULL,
    "apkSize" INTEGER NOT NULL,
    "releaseNotes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "downloads" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "downloadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "downloads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "app_versions_versionCode_key" ON "app_versions"("versionCode");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "app_versions_isActive_idx" ON "app_versions"("isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "app_versions_versionCode_idx" ON "app_versions"("versionCode");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "app_versions_createdAt_idx" ON "app_versions"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "downloads_versionId_idx" ON "downloads"("versionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "downloads_downloadedAt_idx" ON "downloads"("downloadedAt");

-- AddForeignKey
ALTER TABLE "downloads" ADD CONSTRAINT "downloads_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "app_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

