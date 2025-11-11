import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateUserRoles() {
  try {
    console.log('🔄 Actualizando roles de usuarios...');

    // Obtener todos los usuarios
    const users = await prisma.user.findMany();

    console.log(`📊 Encontrados ${users.length} usuarios`);

    // Actualizar usuarios existentes
    // Si tienen role "CLIENT" (string), mantenerlo como CLIENT (enum)
    // Si no tienen role o es diferente, asignar USER por defecto
    for (const user of users) {
      let newRole: 'ADMIN' | 'CLIENT' | 'USER' = 'USER';
      
      // Si el role actual es "CLIENT", mantenerlo
      if (user.role === 'CLIENT' || (user.role as any) === 'CLIENT') {
        newRole = 'CLIENT';
      }
      // Si el role es "ADMIN", mantenerlo
      else if (user.role === 'ADMIN' || (user.role as any) === 'ADMIN') {
        newRole = 'ADMIN';
      }
      // Por defecto, asignar USER
      else {
        newRole = 'USER';
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { role: newRole },
      });

      console.log(`✅ Usuario ${user.email} actualizado a role: ${newRole}`);
    }

    // Crear usuario admin de ejemplo si no existe
    const adminEmail = 'admin@barberapp.com';
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      
      const admin = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: 'Administrador',
          role: 'ADMIN',
          avatarSeed: `${adminEmail}-${Date.now()}`,
        },
      });

      console.log(`✅ Usuario admin creado:`);
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: Admin123!`);
      console.log(`   Role: ADMIN`);
    } else {
      // Actualizar a ADMIN si ya existe
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { role: 'ADMIN' },
      });
      console.log(`✅ Usuario ${adminEmail} actualizado a ADMIN`);
    }

    console.log('\n✨ Proceso completado exitosamente!');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateUserRoles();

