#!/usr/bin/env node
/**
 * Seed chronic disease templates + configurable fields.
 *
 * Usage:
 *   npm run seed:chronic-diseases
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const prisma = require('../lib/prisma');
const { TEMPLATES } = require('../data/chronicDiseaseTemplates');

async function seed() {
  console.log(`Seeding ${TEMPLATES.length} chronic disease templates...`);

  for (const tpl of TEMPLATES) {
    const template = await prisma.chronicDiseaseTemplate.upsert({
      where: { diseaseCode: tpl.diseaseCode },
      create: {
        diseaseCode: tpl.diseaseCode,
        name: tpl.name,
        defaultIcd: tpl.defaultIcd || null,
        displayOrder: tpl.displayOrder,
        active: true,
      },
      update: {
        name: tpl.name,
        defaultIcd: tpl.defaultIcd || null,
        displayOrder: tpl.displayOrder,
        active: true,
      },
    });

    await prisma.chronicDiseaseTemplateField.deleteMany({ where: { templateId: template.id } });

    let order = 0;
    const rows = [];
    for (const g of tpl.groups || []) {
      for (const f of g.fields || []) {
        rows.push({
          templateId: template.id,
          fieldKey: f.fieldKey,
          fieldName: f.fieldName,
          fieldType: f.fieldType,
          groupKey: g.groupKey,
          groupName: g.groupName,
          options: f.options || undefined,
          displayOrder: order++,
          required: Boolean(f.required),
          active: true,
        });
      }
    }

    if (rows.length) {
      await prisma.chronicDiseaseTemplateField.createMany({ data: rows });
    }
    console.log(`  ✓ ${tpl.name} (${rows.length} fields)`);
  }

  console.log('Done.');
}

seed()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
