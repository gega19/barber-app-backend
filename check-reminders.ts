import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkReminders() {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        barber: true,
        user: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    console.log(`\nFound ${appointments.length} recent active appointments:`);
    
    for (const apt of appointments) {
      console.log(`\n--- Appointment ID: ${apt.id} ---`);
      console.log(`Barber: ${apt.barber?.name}`);
      console.log(`Client: ${apt.user?.name || apt.clientName} (${apt.user?.email || apt.clientPhone})`);
      console.log(`Date: ${apt.date.toISOString().split('T')[0]}`);
      console.log(`Time: ${apt.time}`);
      console.log(`Status: ${apt.status}`);
      console.log(`Reminder 24h Sent At: ${apt.reminder24hSentAt ? apt.reminder24hSentAt.toISOString() : 'NULL'}`);
      console.log(`Reminder 1h Sent At: ${apt.reminder1hSentAt ? apt.reminder1hSentAt.toISOString() : 'NULL'}`);
      
      // Calculate diff to see if it SHOULD have been sent
      const [hour, minute] = apt.time.split(':').map(Number);
      const aptDate = new Date(apt.date);
      aptDate.setHours(hour, minute, 0, 0);
      
      const now = new Date();
      const diffMs = aptDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      console.log(`Time remaining: ${diffHours.toFixed(2)} hours`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkReminders();
