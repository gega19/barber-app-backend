/**
 * Crea una competencia de prueba (ACTIVE) con puntos para probar el cierre
 * y que se guarde el ganador y el snapshot.
 *
 * Uso: npx ts-node scripts/seed-competition-for-test.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 2, 0, 23, 59, 59, 999));

  // Permite nombre personalizado o usa uno por defecto
  const customName = process.env.COMPETITION_NAME;
  const name = customName || `Competencia ${['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][now.getUTCMonth()]} ${now.getUTCFullYear()}`;
  const prize = process.env.PERIOD_PRIZE ?? '50€';

  // Configuración de puntos (puedes cambiar estos valores mediante variables de entorno)
  const MAX_POINTS = parseInt(process.env.MAX_POINTS || '100', 10); // Puntos máximos para el #1
  const MIN_POINTS = parseInt(process.env.MIN_POINTS || '10', 10);  // Puntos mínimos
  const POINTS_DECREASE = parseInt(process.env.POINTS_DECREASE || '8', 10); // Disminución por posición
  const RANDOM_VARIATION = parseInt(process.env.RANDOM_VARIATION || '12', 10); // Variación aleatoria

  console.log('Creando competencia de prueba para cerrar...');
  console.log(`  Nombre: ${name}`);
  console.log(`  Inicio: ${start.toISOString()}`);
  console.log(`  Fin:    ${end.toISOString()}`);
  console.log(`  Premio: ${prize}`);
  console.log(`  Configuración de puntos: Max=${MAX_POINTS}, Min=${MIN_POINTS}, Decrease=${POINTS_DECREASE}, Random=${RANDOM_VARIATION}`);

  const period = await prisma.competitionPeriod.create({
    data: {
      name,
      startDate: start,
      endDate: end,
      status: 'ACTIVE',
      prize,
    },
  });

  const barbers = await prisma.barber.findMany({
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });

  if (barbers.length === 0) {
    console.log('  No hay barberos. Crea barberos y vuelve a ejecutar seed:competition-points con PERIOD_ID=' + period.id);
    console.log(`✅ Periodo creado: ${period.id}`);
    return;
  }

  for (let i = 0; i < barbers.length; i++) {
    // Calcula puntos base: empieza en MAX_POINTS y disminuye por posición
    const base = Math.max(MIN_POINTS, MAX_POINTS - i * POINTS_DECREASE);
    // Añade variación aleatoria para hacerlo más realista
    const randomVariation = Math.floor(Math.random() * RANDOM_VARIATION) - Math.floor(RANDOM_VARIATION / 2);
    const points = Math.max(MIN_POINTS, base + randomVariation);
    
    await prisma.barberPeriodPoints.upsert({
      where: {
        barberId_periodId: { barberId: barbers[i].id, periodId: period.id },
      },
      create: {
        barberId: barbers[i].id,
        periodId: period.id,
        points: points,
      },
      update: {
        points: points,
      },
    });
  }

  console.log(`  Puntos asignados a ${barbers.length} barberos.`);
  console.log(`✅ Periodo creado: ${period.id}`);
  console.log('');
  console.log('Siguiente paso:');
  console.log('  1. Abre el backoffice → Competencia');
  console.log('  2. Entra en "Ver puntuaciones" de esta competencia');
  console.log('  3. Pulsa "Cerrar periodo"');
  console.log('  4. Comprueba que se guarda el ganador y la clasificación final.');
  console.log('  5. En la app verás la competencia anterior con "Finalizada" y "Ganador: [nombre]".');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
