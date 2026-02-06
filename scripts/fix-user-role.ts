import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixUserRole(email: string, role: 'BARBER' | 'BARBERSHOP' = 'BARBER') {
  try {
    console.log(`🔄 Corrigiendo rol del usuario: ${email}...`);

    // Buscar el usuario por email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      console.error(`❌ Usuario ${email} no encontrado`);
      return;
    }

    console.log(`📋 Usuario encontrado:`);
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Nombre: ${user.name}`);
    console.log(`   - Rol actual: ${user.role}`);

    // Verificar si tiene perfil de barbero
    const barber = await prisma.barber.findUnique({
      where: { email },
      select: { id: true },
    });

    if (barber) {
      console.log(`✂️  Usuario tiene perfil de barbero (ID: ${barber.id})`);
    } else {
      console.log(`⚠️  Usuario NO tiene perfil de barbero`);
    }

    // Actualizar el rol
    if (user.role !== role) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role },
      });
      console.log(`✅ Usuario ${email} actualizado a role: ${role}`);
    } else {
      console.log(`ℹ️  Usuario ${email} ya tiene el rol correcto: ${role}`);
    }

    console.log('\n✨ Proceso completado exitosamente!');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Obtener email desde argumentos de línea de comandos
const email = process.argv[2];
const role = (process.argv[3] as 'BARBER' | 'BARBERSHOP') || 'BARBER';

if (!email) {
  console.error('❌ Error: Debes proporcionar un email como argumento');
  console.log('Uso: npx ts-node scripts/fix-user-role.ts <email> [role]');
  console.log('Ejemplo: npx ts-node scripts/fix-user-role.ts cliente6@test.com BARBER');
  process.exit(1);
}

fixUserRole(email, role);
