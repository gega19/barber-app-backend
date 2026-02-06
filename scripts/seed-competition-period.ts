/**
 * Crea un periodo de competencia de prueba en la base de datos de desarrollo.
 * Por defecto: del 5 de febrero al 5 de marzo (año actual o 2026).
 *
 * Uso:
 *   npx ts-node scripts/seed-competition-period.ts
 *   START_DATE=2026-02-05 END_DATE=2026-03-05 npx ts-node scripts/seed-competition-period.ts
 *
 * Opcional: SEED_POINTS=1 asigna puntos de ejemplo a los primeros barberos del sistema.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getDefaultDates(): { start: Date; end: Date } {
  const year = parseInt(process.env.YEAR || '2026', 10);
  const start = new Date(Date.UTC(year, 1, 5, 0, 0, 0, 0)); // 5 feb
  const end = new Date(Date.UTC(year, 2, 5, 23, 59, 59, 999)); // 5 mar end of day
  return { start, end };
}

async function main() {
  const startInput = process.env.START_DATE;
  const endInput = process.env.END_DATE;
  const seedPoints = process.env.SEED_POINTS === '1';

  const start = startInput ? new Date(startInput) : getDefaultDates().start;
  const end = endInput ? new Date(endInput) : getDefaultDates().end;

  if (end <= start) {
    console.error('END_DATE debe ser posterior a START_DATE');
    process.exit(1);
  }

  const name = process.env.PERIOD_NAME || `Competencia ${start.getMonth() + 1}/${start.getFullYear()}`;
  const status = (process.env.STATUS as 'DRAFT' | 'ACTIVE') || 'ACTIVE';
  const prize = process.env.PERIOD_PRIZE ?? null;

  console.log('Creando periodo de competencia de prueba...');
  console.log(`  Nombre: ${name}`);
  console.log(`  Inicio: ${start.toISOString()}`);
  console.log(`  Fin:    ${end.toISOString()}`);
  console.log(`  Estado: ${status}`);
  if (prize) console.log(`  Premio: ${prize}`);

  const period = await prisma.competitionPeriod.create({
    data: {
      name,
      startDate: start,
      endDate: end,
      status,
      prize: prize || undefined,
    },
  });

  console.log(`✅ Periodo creado: ${period.id}`);

  if (seedPoints) {
    const barbers = await prisma.barber.findMany({ take: 10, select: { id: true } });
    if (barbers.length === 0) {
      console.log('  No hay barberos en la BD; omitiendo puntos de ejemplo.');
    } else {
      for (let i = 0; i < barbers.length; i++) {
        await prisma.barberPeriodPoints.upsert({
          where: {
            barberId_periodId: { barberId: barbers[i].id, periodId: period.id },
          },
          create: {
            barberId: barbers[i].id,
            periodId: period.id,
            points: Math.max(0, 20 - i * 2 + Math.floor(Math.random() * 5)),
          },
          update: {
            points: Math.max(0, 20 - i * 2 + Math.floor(Math.random() * 5)),
          },
        });
      }
      console.log(`  Puntos de ejemplo asignados a ${barbers.length} barberos.`);
    }
  } else {
    console.log('  Para asignar puntos de ejemplo, ejecuta con SEED_POINTS=1');
  }

  console.log('Listo.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
