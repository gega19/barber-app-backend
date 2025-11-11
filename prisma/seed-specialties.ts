import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

async function main() {
  console.log('🌱 Seeding specialties...');
  
  for (const specialty of specialties) {
    await prisma.specialty.upsert({
      where: { name: specialty.name },
      update: {},
      create: specialty,
    });
    console.log(`✅ Created/Updated: ${specialty.name}`);
  }
  
  console.log('✨ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
