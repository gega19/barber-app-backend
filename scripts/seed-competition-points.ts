/**
 * Asigna puntos de ejemplo a todos los barberos en un periodo de competencia.
 * Usa el periodo más reciente si no se indica PERIOD_ID.
 *
 * Uso:
 *   npx ts-node scripts/seed-competition-points.ts
 *   PERIOD_ID=cmlaavrp600001a7xka2reti8 npx ts-node scripts/seed-competition-points.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const periodId = process.env.PERIOD_ID;

  const period = periodId
    ? await prisma.competitionPeriod.findUnique({ where: { id: periodId } })
    : await prisma.competitionPeriod.findFirst({
        orderBy: { createdAt: 'desc' },
      });

  if (!period) {
    console.error('No hay ningún periodo de competencia. Crea uno con: npm run seed:competition');
    process.exit(1);
  }

  const barbers = await prisma.barber.findMany({
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });

  if (barbers.length === 0) {
    console.error('No hay barberos en la base de datos.');
    process.exit(1);
  }

  console.log(`Periodo: ${period.name || period.id} (${period.id})`);
  console.log(`Barberos a actualizar: ${barbers.length}`);

  // Puntos en orden descendente con algo de variación (ej: 85, 72, 61, 55, 48...)
  for (let i = 0; i < barbers.length; i++) {
    const base = Math.max(10, 90 - i * 8);
    const points = base + Math.floor(Math.random() * 12) - 4;
    await prisma.barberPeriodPoints.upsert({
      where: {
        barberId_periodId: { barberId: barbers[i].id, periodId: period.id },
      },
      create: {
        barberId: barbers[i].id,
        periodId: period.id,
        points: Math.max(0, points),
      },
      update: {
        points: Math.max(0, points),
      },
    });
  }

  console.log(`✅ Puntos asignados a ${barbers.length} barberos en el periodo.`);
  console.log('Listo. Recarga el ranking en el backoffice o en la app.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
