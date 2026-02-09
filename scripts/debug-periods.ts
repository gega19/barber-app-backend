
import prisma from '../src/config/prisma';

async function main() {
    const periods = await prisma.competitionPeriod.findMany({
        orderBy: { startDate: 'desc' }
    });

    console.log('--- Competition Periods ---');
    periods.forEach(p => {
        console.log(`ID: ${p.id}`);
        console.log(`Name: ${p.name}`);
        console.log(`Status: ${p.status}`);
        console.log(`Range: ${p.startDate.toISOString()} -> ${p.endDate.toISOString()}`);
        console.log('---');
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
