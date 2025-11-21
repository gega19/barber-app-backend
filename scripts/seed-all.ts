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
          role: 'ADMIN',
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
        data: { role: 'ADMIN' },
      });
      console.log(`✅ User ${ADMIN_EMAIL} updated to ADMIN role`);
    }
  } catch (error: any) {
    console.error(`❌ Error creating admin user:`, error.message);
  }

  console.log('✨ Admin user seeding completed!');
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

