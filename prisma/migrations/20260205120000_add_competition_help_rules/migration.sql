-- CreateTable
CREATE TABLE "competition_help_rules" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competition_help_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "competition_help_rules_sortOrder_idx" ON "competition_help_rules"("sortOrder");

-- Seed default rules
INSERT INTO "competition_help_rules" ("id", "content", "sortOrder") VALUES
  ('chelp001', 'Solo suman puntos las citas completadas.', 0),
  ('chelp002', 'El cliente debe tener teléfono verificado para que la cita cuente.', 1),
  ('chelp003', 'Cada cita cuenta solo para un barbero y en el periodo en que se realizó.', 2),
  ('chelp004', 'Al cerrar el periodo, el barbero con más puntos es el ganador.', 3);
