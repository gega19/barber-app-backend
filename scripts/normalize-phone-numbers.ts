/**
 * Migración única: normaliza todos los teléfonos guardados a E.164.
 * Ejecutar una vez después de desplegar la normalización en auth.service:
 *   npx ts-node scripts/normalize-phone-numbers.ts
 */
import { PrismaClient } from '@prisma/client';
import { normalizePhoneToE164 } from '../src/utils/phone';

const prisma = new PrismaClient();

async function main() {
  console.log('Normalizando teléfonos a E.164...');

  const users = await prisma.user.findMany({
    where: { phone: { not: null } },
    select: { id: true, phone: true },
  });

  let updated = 0;
  for (const u of users) {
    const phone = u.phone!;
    const normalized = normalizePhoneToE164(phone);
    if (normalized && normalized !== phone) {
      try {
        await prisma.user.update({
          where: { id: u.id },
          data: { phone: normalized },
        });
        console.log(`  User ${u.id}: ${phone} -> ${normalized}`);
        updated++;
      } catch (e: any) {
        if (e?.code === 'P2002') {
          console.warn(`  Duplicado: ${phone} y otro usuario tienen el mismo número normalizado ${normalized}. Revisar manualmente.`);
        } else throw e;
      }
    }
  }

  const sends = await prisma.phoneCodeSend.findMany();
  for (const s of sends) {
    const normalized = normalizePhoneToE164(s.phone);
    if (normalized && normalized !== s.phone) {
      try {
        await prisma.phoneCodeSend.delete({ where: { phone: s.phone } });
        await prisma.phoneCodeSend.upsert({
          where: { phone: normalized },
          create: { phone: normalized, lastSentAt: s.lastSentAt },
          update: { lastSentAt: s.lastSentAt },
        });
        console.log(`  PhoneCodeSend: ${s.phone} -> ${normalized}`);
        updated++;
      } catch (e) {
        console.warn('  PhoneCodeSend skip:', s.phone, e);
      }
    }
  }

  console.log(`Listo. ${updated} registros actualizados.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
