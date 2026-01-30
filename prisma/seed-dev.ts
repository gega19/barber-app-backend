import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const specialtiesList = [
    'Classic Cuts',
    'Fade',
    'Beard Styling',
    'Modern Styles',
    'Coloring',
    'Hair Tattoo'
];

const serviceTypes = [
    { name: 'Corte Clásico', price: 15.0, duration: '45 mins' },
    { name: 'Corte + Barba', price: 25.0, duration: '60 mins' },
    { name: 'Fade Master', price: 20.0, duration: '50 mins' },
    { name: 'Afeitado Royal', price: 12.0, duration: '30 mins' },
    { name: 'Black Mask', price: 10.0, duration: '20 mins' },
    { name: 'Perfilado Cejas', price: 5.0, duration: '15 mins' },
];

const workplaceNames = [
    'Barbería Central',
    'The Gentleman Club',
    'Urban Style Barbers',
    'Vintage Cuts',
    'Elite Grooming Lounge'
];

const firstNames = ['Carlos', 'Miguel', 'Ana', 'Jose', 'David', 'Luis', 'Sofia', 'Maria', 'Pedro', 'Juan', 'Andres', 'Fernando', 'Laura', 'Diana', 'Roberto'];
const lastNames = ['Perez', 'Gonzalez', 'Rodriguez', 'Lopez', 'Martinez', 'Garcia', 'Hernandez', 'Diaz', 'Moreno', 'Alvarez'];

function getRandomItem(arr: any[]) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateName() {
    return `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`;
}

async function main() {
    console.log('🚀 Starting EXTENDED DEV database seeding...');

    try {
        const passwordHash = await bcrypt.hash('123456', 10);

        // 1. Specialties
        console.log('🌱 Seeding Specialties...');
        const specialties = [];
        for (const name of specialtiesList) {
            const s = await prisma.specialty.upsert({
                where: { name },
                update: {},
                create: { name, description: `Especialista en ${name}` },
            });
            specialties.push(s);
        }

        // 2. Workplaces (5)
        console.log('🌱 Seeding 5 Workplaces...');
        const workplaces = [];
        for (let i = 0; i < 5; i++) {
            const name = i < workplaceNames.length ? workplaceNames[i] : `Barber Shop ${i + 1}`;
            const wp = await prisma.workplace.upsert({
                where: { name },
                update: {},
                create: {
                    name,
                    address: `Calle ${i + 1} con Av. Principal, Local ${i + 10}`,
                    city: 'Caracas',
                    description: `La mejor experiencia en ${name}. Calidad y servicio garantizado.`,
                    rating: 4.0 + (Math.random() * 1.0), // 4.0 to 5.0
                    reviews: Math.floor(Math.random() * 200) + 50,
                    image: `https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=1000&random=${i}`,
                    latitude: 10.4806 + (Math.random() * 0.05 - 0.025), // Random variation around Caracas
                    longitude: -66.9036 + (Math.random() * 0.05 - 0.025),
                }
            });
            workplaces.push(wp);
            console.log(`   🏢 Workplace created: ${name}`);
        }

        // 3. Barbers (15)
        console.log('🌱 Seeding 15 Barbers...');
        for (let i = 1; i <= 15; i++) {
            const name = generateName();
            const email = `barbero${i}@barber.com`;
            const workplace = getRandomItem(workplaces);
            const specialty = getRandomItem(specialties);

            // Ensure unique email by upserting User first
            await prisma.user.upsert({
                where: { email },
                update: {},
                create: {
                    email,
                    name,
                    password: passwordHash,
                    role: UserRole.BARBER,
                    workplaceId: workplace.id,
                    avatarSeed: `${name}-${i}`,
                },
            });

            // Create/Update Barber Profile
            await prisma.barber.upsert({
                where: { email },
                update: { workplaceId: workplace.id },
                create: {
                    name,
                    email,
                    specialty: specialty.name,
                    specialtyId: specialty.id,
                    experienceYears: Math.floor(Math.random() * 15) + 1,
                    location: workplace.city || 'Caracas',
                    image: `https://i.pravatar.cc/300?u=${email}`, // Placeholder avatar
                    rating: 3.5 + (Math.random() * 1.5), // 3.5 to 5.0
                    reviews: Math.floor(Math.random() * 100),
                    workplaceId: workplace.id,
                    bio: `Hola, soy ${name}, especialista en ${specialty.name} con años de experiencia.`,
                    services: {
                        create: serviceTypes.slice(0, Math.floor(Math.random() * 3) + 3).map(s => ({ // Assign 3-6 random services
                            name: s.name,
                            price: s.price + (Math.random() * 5), // Slight price variation
                            description: s.duration
                        }))
                    },
                    availability: {
                        // Create default M-F 09-18 availability
                        createMany: {
                            data: [1, 2, 3, 4, 5].map(day => ({
                                dayOfWeek: day,
                                startTime: '09:00',
                                endTime: '18:00',
                                isAvailable: true
                            }))
                        }
                    }
                }
            });
            console.log(`   ✂️ Barber created: ${name} @ ${workplace.name}`);
        }

        // 4. Clients (20)
        console.log('🌱 Seeding 20 Clients...');
        for (let i = 1; i <= 20; i++) {
            const name = generateName();
            const email = `cliente${i}@test.com`;

            await prisma.user.upsert({
                where: { email },
                update: {},
                create: {
                    email,
                    name,
                    password: passwordHash,
                    role: UserRole.CLIENT,
                    phone: `+58412${Math.floor(1000000 + Math.random() * 9000000)}`,
                    avatarSeed: `${name}-${i}`,
                }
            });
            console.log(`   👤 Client created: ${name} (${email})`);
        }

        console.log('\n✨ EXTENDED DEV Seeding Completed!');
        console.log('   Stats:');
        console.log('   - 5 Workplaces');
        console.log('   - 15 Barbers (Assignments random)');
        console.log('   - 20 Clients (cliente1@test.com ... cliente20@test.com)');
        console.log('   - All Passwords: 123456');

    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
