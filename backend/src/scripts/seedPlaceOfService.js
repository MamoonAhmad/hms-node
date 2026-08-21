#!/usr/bin/env node
/**
 * Seed CMS Place of Service codes.
 *
 * Usage:
 *   node src/scripts/seedPlaceOfService.js
 *   npm run seed:place-of-service
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const prisma = require('../lib/prisma');
const { CMS_POS_SEED } = require('../lib/placeOfService');

async function resolveUserId() {
  const user = await prisma.user.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!user) {
    throw new Error('No active user found. Run seed:admin first.');
  }
  return user.id;
}

async function seedPlaceOfService(userId) {
  let created = 0;
  let updated = 0;

  for (const row of CMS_POS_SEED) {
    const existing = await prisma.placeOfServiceCode.findFirst({
      where: { code: row.code, deletedAt: null },
    });

    const data = {
      code: row.code,
      name: row.name,
      description: row.description,
      category: row.category,
      cmsStandard: true,
      isActive: true,
      isBillable: true,
      isDefault: !!row.isDefault,
      sortOrder: row.sortOrder,
      updatedBy: userId,
    };

    if (existing) {
      await prisma.placeOfServiceCode.update({
        where: { id: existing.id },
        data,
      });
      updated += 1;
    } else {
      await prisma.placeOfServiceCode.create({
        data: {
          ...data,
          createdBy: userId,
        },
      });
      created += 1;
    }
  }

  const defaults = await prisma.placeOfServiceCode.findMany({
    where: { deletedAt: null, isDefault: true },
  });
  if (defaults.length > 1) {
    const keep = defaults.find((d) => d.code === '11') || defaults[0];
    await prisma.placeOfServiceCode.updateMany({
      where: { deletedAt: null, isDefault: true, NOT: { id: keep.id } },
      data: { isDefault: false },
    });
  } else if (defaults.length === 0) {
    await prisma.placeOfServiceCode.updateMany({
      where: { code: '11', deletedAt: null },
      data: { isDefault: true },
    });
  }

  return { created, updated, total: CMS_POS_SEED.length };
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('Missing DATABASE_URL. Set it in backend/.env');
    process.exit(1);
  }

  try {
    console.log('Seeding Place of Service codes...\n');
    const userId = await resolveUserId();
    const result = await seedPlaceOfService(userId);
    console.log(`  Place of Service  +${result.created} created / ~${result.updated} updated (${result.total} CMS codes)`);
    console.log('\nDone.');
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { seedPlaceOfService };
