import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncBarberRoles() {
  try {
    console.log('🔄 Sincronizando roles de usuarios con perfiles de barbero...');

    // Obtener todos los barberos
    const barbers = await prisma.barber.findMany({
      select: { email: true },
    });

    console.log(`📊 Encontrados ${barbers.length} barberos`);

    const barberEmails = new Set(barbers.map(b => b.email));

    // Obtener usuarios que tienen perfil de barbero pero rol incorrecto
    const usersToUpdate = await prisma.user.findMany({
      where: {
        email: { in: Array.from(barberEmails) },
        role: { notIn: ['BARBER', 'BARBERSHOP'] },
      },
    });

    console.log(`🔧 Encontrados ${usersToUpdate.length} usuarios para actualizar`);

    // Actualizar el rol de estos usuarios
    for (const user of usersToUpdate) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'BARBER' },
      });
      console.log(`✅ Usuario ${user.email} actualizado a role: BARBER`);
    }

    console.log('\n✨ Proceso completado exitosamente!');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

syncBarberRoles();
