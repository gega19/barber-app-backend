const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function viewDatabase() {
  try {
    console.log('\n=== DATABASE VIEWER ===\n');
    
    // Users
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarSeed: true,
      }
    });
    console.log('👤 USERS:', users.length > 0 ? users : 'No users found');
    
    // Barbers
    const barbers = await prisma.barber.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        rating: true,
      }
    });
    console.log('\n💇 BARBERS:', barbers.length > 0 ? barbers : 'No barbers found');
    
    // Appointments
    const appointments = await prisma.appointment.findMany({
      take: 5,
      select: {
        id: true,
        date: true,
        status: true,
      }
    });
    console.log('\n📅 APPOINTMENTS:', appointments.length > 0 ? appointments : 'No appointments found');
    
    // Promotions
    const promotions = await prisma.promotion.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        code: true,
        isActive: true,
      }
    });
    console.log('\n🎁 PROMOTIONS:', promotions.length > 0 ? promotions : 'No promotions found');
    
    console.log('\n=== Database connection successful! ===\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

viewDatabase();

