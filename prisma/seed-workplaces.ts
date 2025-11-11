import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const workplaces = [
  { 
    name: 'Barbería Clásica Caracas', 
    address: 'Av. Francisco de Miranda, Los Palos Grandes',
    city: 'Caracas',
    description: 'Barbería tradicional en el corazón de Caracas'
  },
  { 
    name: 'El Estilo Premium', 
    address: 'Centro Comercial Sambil',
    city: 'Caracas',
    description: 'Salón de alta gama con servicios exclusivos'
  },
  { 
    name: 'Corte & Estilo', 
    address: 'Plaza Venezuela',
    city: 'Caracas',
    description: 'Barbería moderna con los últimos estilos'
  },
  { 
    name: 'The Gentleman\'s Cut', 
    address: 'Las Mercedes',
    city: 'Caracas',
    description: 'Experiencia premium de barbería'
  },
  { 
    name: 'Estudio Barber Shop', 
    address: 'Chacao',
    city: 'Caracas',
    description: 'Barbería contemporánea con ambiente exclusivo'
  },
  { 
    name: 'Casa del Barbero', 
    address: 'Valencia Centro',
    city: 'Valencia',
    description: 'Barbería tradicional en Valencia'
  },
  { 
    name: 'Estilo & Tradición', 
    address: 'Maracaibo',
    city: 'Maracaibo',
    description: 'Barbería clásica en Maracaibo'
  },
];

async function main() {
  console.log('🌱 Seeding workplaces...');
  
  for (const workplace of workplaces) {
    await prisma.workplace.upsert({
      where: { name: workplace.name },
      update: {},
      create: workplace,
    });
    console.log(`✅ Created/Updated: ${workplace.name}`);
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
