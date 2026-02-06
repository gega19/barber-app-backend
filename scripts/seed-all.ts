import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Especialidades
const specialties = [
  { name: 'Classic Cuts', description: 'Cortes clásicos y tradicionales' },
  { name: 'Fade', description: 'Cortes fade modernos' },
  { name: 'Beard Styling', description: 'Estilizado y cuidado de barba' },
  { name: 'Premium & Luxury', description: 'Servicios premium y de lujo' },
  { name: 'Creative Designs', description: 'Diseños creativos y artísticos' },
  { name: 'Traditional Barbershop', description: 'Barbería tradicional' },
  { name: 'Modern Styles', description: 'Estilos modernos y contemporáneos' },
  { name: 'Hair & Beard Combo', description: 'Corte de cabello y barba combinados' },
];

// Métodos de pago
const paymentMethods = [
  { name: 'Efectivo', icon: '💵', isActive: true },
  { name: 'Pago movil', icon: '📱', isActive: true },
];

// Usuario admin por defecto
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@bartop.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Administrador';

async function seedSpecialties() {
  console.log('🌱 Seeding specialties...');
  
  for (const specialty of specialties) {
    await prisma.specialty.upsert({
      where: { name: specialty.name },
      update: {},
      create: specialty,
    });
    console.log(`✅ Created/Updated specialty: ${specialty.name}`);
  }
  
  console.log('✨ Specialties seeding completed!');
}

async function seedPaymentMethods() {
  console.log('🌱 Seeding payment methods...');

  for (const method of paymentMethods) {
    try {
      await prisma.paymentMethod.upsert({
        where: { name: method.name },
        update: {},
        create: method,
      });
      console.log(`✅ Created/Updated payment method: ${method.name} (${method.icon})`);
    } catch (error: any) {
      console.error(`❌ Error creating payment method "${method.name}":`, error.message);
    }
  }

  console.log('✨ Payment methods seeding completed!');
}

async function seedAdminUser() {
  console.log('🌱 Seeding admin user...');

  try {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      
      const admin = await prisma.user.create({
        data: {
          email: ADMIN_EMAIL,
          password: hashedPassword,
          name: ADMIN_NAME,
          role: 'ADMIN' as any, // Type assertion para evitar problemas de tipo
          avatarSeed: `${ADMIN_EMAIL}-${Date.now()}`,
        },
      });

      console.log(`✅ Admin user created:`);
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log(`   Password: ${ADMIN_PASSWORD}`);
      console.log(`   Name: ${ADMIN_NAME}`);
      console.log(`   Role: ADMIN`);
    } else {
      // Actualizar a ADMIN si ya existe
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { role: 'ADMIN' as any }, // Type assertion
      });
      console.log(`✅ User ${ADMIN_EMAIL} updated to ADMIN role`);
    }
  } catch (error: any) {
    console.error(`❌ Error creating admin user:`, error.message);
    if (error.message?.includes('UserRole') || error.message?.includes('does not exist')) {
      console.error(`⚠️  The UserRole enum doesn't exist in the database.`);
      console.error(`⚠️  Please run the migration: 20251121120000_fix_user_role_enum`);
      console.error(`⚠️  Or run: npx prisma migrate deploy`);
    }
    throw error; // Re-throw para que el proceso falle si es crítico
  }

  console.log('✨ Admin user seeding completed!');
}

// Reglas de ayuda para la competencia (app). Solo se insertan si no hay ninguna.
const DEFAULT_HELP_RULES = [
  'Solo suman puntos las citas completadas.',
  'El cliente debe tener teléfono verificado para que la cita cuente.',
  'Cada cita cuenta solo para un barbero y en el periodo en que se realizó.',
  'Al cerrar el periodo, el barbero con más puntos es el ganador.',
];

async function seedCompetitionHelpRules() {
  console.log('🌱 Seeding competition help rules...');

  const count = await prisma.competitionHelpRule.count();
  if (count > 0) {
    console.log(`   Ya existen ${count} reglas. Omitiendo.`);
    console.log('✨ Competition help rules seeding skipped (already present).');
    return;
  }

  for (let i = 0; i < DEFAULT_HELP_RULES.length; i++) {
    await prisma.competitionHelpRule.create({
      data: { content: DEFAULT_HELP_RULES[i], sortOrder: i },
    });
    console.log(`✅ Regla ${i + 1} creada`);
  }
  console.log('✨ Competition help rules seeding completed!');
}

async function main() {
  console.log('🚀 Starting database seeding...\n');

  try {
    await seedSpecialties();
    console.log('');
    
    await seedPaymentMethods();
    console.log('');
    
    await seedAdminUser();
    console.log('');

    await seedCompetitionHelpRules();
    console.log('');

    console.log('✨ All seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  });

