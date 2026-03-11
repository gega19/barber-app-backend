import { PrismaClient } from '@prisma/client';
import competitionService from './src/services/competition.service';

const prisma = new PrismaClient();

async function main() {
  const period = await prisma.competitionPeriod.findFirst({
    where: { status: 'ACTIVE' },
  });
  if (period) {
    console.log(`Active period found: ${period.id}. Recomputing...`);
    await competitionService.recomputePeriodPoints(period.id);
    console.log('Recomputed.');
    const leaderboard = await competitionService.getLeaderboard(period.id, 5);
    console.log(JSON.stringify(leaderboard, null, 2));
  } else {
    console.log('No active period');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
