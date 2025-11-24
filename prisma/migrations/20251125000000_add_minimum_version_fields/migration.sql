-- AlterTable
ALTER TABLE "app_versions" ADD COLUMN IF NOT EXISTS "minimumVersionCode" INTEGER;
ALTER TABLE "app_versions" ADD COLUMN IF NOT EXISTS "updateUrl" TEXT;
ALTER TABLE "app_versions" ADD COLUMN IF NOT EXISTS "updateType" TEXT;
ALTER TABLE "app_versions" ADD COLUMN IF NOT EXISTS "forceUpdate" BOOLEAN NOT NULL DEFAULT false;

-- Add comment to columns
COMMENT ON COLUMN "app_versions"."minimumVersionCode" IS 'Versión mínima requerida (versionCode)';
COMMENT ON COLUMN "app_versions"."updateUrl" IS 'URL personalizada de descarga';
COMMENT ON COLUMN "app_versions"."updateType" IS 'Tipo de actualización: store, url, o apk';
COMMENT ON COLUMN "app_versions"."forceUpdate" IS 'Forzar actualización si la versión es menor a minimumVersionCode';

