
import prisma from '../src/config/prisma';

async function debugCompetition() {
    console.log('🔍 Starting Competition Debugging...\n');

    // 1. Get Active Periods
    const periods = await prisma.competitionPeriod.findMany({
        where: { status: 'ACTIVE' },
    });

    console.log(`📅 Found ${periods.length} ACTIVE competition periods:`);
    for (const p of periods) {
        console.log(`   - ID: ${p.id}`);
        console.log(`     Name: ${p.name}`);
        console.log(`     Range: ${p.startDate.toISOString()} to ${p.endDate.toISOString()}`);
    }
    console.log('');

    if (periods.length === 0) {
        console.log('❌ No active periods found. Points will not be generated.');
        return;
    }

    // 2. Check recent completed appointments (last 24h)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const appointments = await prisma.appointment.findMany({
        where: {
            status: 'COMPLETED',
            updatedAt: { gte: yesterday },
        },
        include: {
            user: true,
            barber: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
    });

    console.log(`📋 Analyzing ${appointments.length} recently COMPLETED appointments (last 24h):`);

    for (const apt of appointments) {
        console.log(`\n   Appointment ID: ${apt.id}`);
        console.log(`   Time: ${apt.date.toISOString()} ${apt.time}`);
        console.log(`   Barber: ${apt.barber.name} (${apt.barberId})`);

        // Check 1: In Period?
        const inPeriod = periods.find(p => p.startDate <= apt.date && p.endDate >= apt.date);
        const check1 = inPeriod ? '✅' : '❌';
        console.log(`   ${check1} Inside Active Period: ${inPeriod ? inPeriod.name : 'No active period covers this date'}`);

        // Check 2: Has User?
        const check2 = apt.userId ? '✅' : '❌';
        console.log(`   ${check2} Has Linked User: ${apt.userId ? `Yes (${apt.user?.name})` : 'No (Guest/Manual Appointment)'}`);

        // Check 3: Verified Phone?
        let check3 = '❌';
        if (apt.userId) {
            check3 = apt.user?.phoneVerifiedAt ? '✅' : '❌';
            console.log(`   ${check3} User Phone Verified: ${apt.user?.phoneVerifiedAt ? apt.user.phoneVerifiedAt.toISOString() : 'Not verified'}`);
        } else {
            console.log(`   ⚪ User Phone Verified: N/A (No user)`);
        }

        // Result
        if (inPeriod && apt.userId && apt.user?.phoneVerifiedAt) {
            console.log('   🎉 RESULT: SHOULD COUNT POINTS');

            // Check if points exist
            const points = await prisma.barberPeriodPoints.findFirst({
                where: {
                    periodId: inPeriod.id,
                    barberId: apt.barberId
                }
            });
            console.log(`      Current points for this barber in period: ${points?.points || 0}`);
        } else {
            console.log('   ⚠️  RESULT: WILL NOT COUNT');
            if (!inPeriod) console.log('      -> Reason: Date not in active period');
            if (!apt.userId) console.log('      -> Reason: Appointment has no linked user (Guest)');
            if (apt.userId && !apt.user?.phoneVerifiedAt) console.log('      -> Reason: User phone not verified');
        }
    }
}

debugCompetition()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
