-- CreateTable
CREATE TABLE IF NOT EXISTS "legal_documents" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "legal_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "legal_documents_type_idx" ON "legal_documents"("type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "legal_documents_isActive_idx" ON "legal_documents"("isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "legal_documents_createdAt_idx" ON "legal_documents"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "legal_documents_type_version_key" ON "legal_documents"("type", "version");

