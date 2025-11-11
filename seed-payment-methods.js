const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding payment methods...');

  const paymentMethods = [
    {
      name: 'Efectivo',
      icon: '💵',
      isActive: true,
    },
    {
      name: 'Tarjeta de Crédito',
      icon: '💳',
      isActive: true,
    },
    {
      name: 'Tarjeta de Débito',
      icon: '💳',
      isActive: true,
    },
    {
      name: 'Transferencia',
      icon: '📱',
      isActive: true,
    },
    {
      name: 'PayPal',
      icon: '💳',
      isActive: true,
    },
  ];

  for (const method of paymentMethods) {
    try {
      const existing = await prisma.paymentMethod.findUnique({
        where: { name: method.name },
      });

      if (existing) {
        console.log(`⚠️  Payment method "${method.name}" already exists, skipping...`);
        continue;
      }

      const created = await prisma.paymentMethod.create({
        data: method,
      });

      console.log(`✅ Created payment method: ${created.name} (${created.icon})`);
    } catch (error) {
      console.error(`❌ Error creating payment method "${method.name}":`, error.message);
    }
  }

  console.log('✨ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

