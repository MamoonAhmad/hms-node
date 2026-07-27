const prisma = require('../lib/prisma');

function serializeRecord(record) {
  if (!record) return null;
  const fields = {};
  for (const fv of record.fieldValues || []) {
    fields[fv.fieldKey] = fv.fieldValue;
  }
  return {
    id: record.id,
    patientId: record.patientId,
    encounterId: record.encounterId,
    conditionCode: record.conditionCode,
    conditionName: record.conditionName,
    icdCode: record.icdCode,
    status: record.status,
    severity: record.severity,
    diagnosisDate: record.diagnosisDate,
    controlStatus: record.controlStatus,
    notes: record.notes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    createdByName: record.createdByName,
    fields,
  };
}

function groupTemplateFields(fields) {
  const groups = [];
  const byGroup = new Map();
  for (const f of fields) {
    const key = f.groupKey || 'general';
    if (!byGroup.has(key)) {
      const g = {
        groupKey: key,
        groupName: f.groupName || 'General',
        fields: [],
      };
      byGroup.set(key, g);
      groups.push(g);
    }
    byGroup.get(key).fields.push({
      fieldKey: f.fieldKey,
      fieldName: f.fieldName,
      fieldType: f.fieldType,
      options: f.options || null,
      required: f.required,
      displayOrder: f.displayOrder,
    });
  }
  return groups;
}

async function listTemplates() {
  const templates = await prisma.chronicDiseaseTemplate.findMany({
    where: { active: true },
    orderBy: { displayOrder: 'asc' },
    include: {
      fields: {
        where: { active: true },
        orderBy: { displayOrder: 'asc' },
      },
    },
  });

  return templates.map((t) => ({
    id: t.id,
    diseaseCode: t.diseaseCode,
    name: t.name,
    defaultIcd: t.defaultIcd,
    displayOrder: t.displayOrder,
    groups: groupTemplateFields(t.fields),
  }));
}

async function listRecords(patientId, { encounterId } = {}) {
  const where = {
    patientId,
    isDeleted: false,
  };
  if (encounterId) where.encounterId = encounterId;

  const rows = await prisma.chronicDiseaseEncounter.findMany({
    where,
    include: { fieldValues: true },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(serializeRecord);
}

async function replaceFieldValues(tx, diseaseRecordId, fields = {}) {
  await tx.chronicDiseaseFieldValue.deleteMany({ where: { diseaseRecordId } });
  const entries = Object.entries(fields || {}).filter(([, v]) => v !== undefined);
  if (!entries.length) return;
  await tx.chronicDiseaseFieldValue.createMany({
    data: entries.map(([fieldKey, fieldValue]) => ({
      diseaseRecordId,
      fieldKey,
      fieldValue: fieldValue == null ? null : String(fieldValue),
    })),
  });
}

async function createRecord(patientId, body, user) {
  const {
    encounterId = null,
    conditionCode,
    conditionName,
    icdCode = null,
    status = 'Active',
    severity = null,
    diagnosisDate = null,
    controlStatus = null,
    notes = null,
    fields = {},
  } = body;

  const record = await prisma.$transaction(async (tx) => {
    const created = await tx.chronicDiseaseEncounter.create({
      data: {
        patientId,
        encounterId: encounterId || null,
        conditionCode,
        conditionName,
        icdCode: icdCode || null,
        status: status || 'Active',
        severity: severity || null,
        diagnosisDate: diagnosisDate ? new Date(diagnosisDate) : null,
        controlStatus: controlStatus || null,
        notes: notes || null,
        createdBy: user?.id || null,
        createdByName: user?.name || user?.email || null,
        updatedBy: user?.id || null,
        updatedByName: user?.name || user?.email || null,
      },
    });
    await replaceFieldValues(tx, created.id, fields);
    return tx.chronicDiseaseEncounter.findUnique({
      where: { id: created.id },
      include: { fieldValues: true },
    });
  });

  return serializeRecord(record);
}

async function updateRecord(patientId, recordId, body, user) {
  const existing = await prisma.chronicDiseaseEncounter.findFirst({
    where: { id: recordId, patientId, isDeleted: false },
  });
  if (!existing) {
    const err = new Error('Chronic disease record not found');
    err.status = 404;
    throw err;
  }

  const {
    encounterId,
    conditionCode,
    conditionName,
    icdCode,
    status,
    severity,
    diagnosisDate,
    controlStatus,
    notes,
    fields,
  } = body;

  const record = await prisma.$transaction(async (tx) => {
    await tx.chronicDiseaseEncounter.update({
      where: { id: recordId },
      data: {
        ...(encounterId !== undefined ? { encounterId: encounterId || null } : {}),
        ...(conditionCode !== undefined ? { conditionCode } : {}),
        ...(conditionName !== undefined ? { conditionName } : {}),
        ...(icdCode !== undefined ? { icdCode: icdCode || null } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(severity !== undefined ? { severity: severity || null } : {}),
        ...(diagnosisDate !== undefined
          ? { diagnosisDate: diagnosisDate ? new Date(diagnosisDate) : null }
          : {}),
        ...(controlStatus !== undefined ? { controlStatus: controlStatus || null } : {}),
        ...(notes !== undefined ? { notes: notes || null } : {}),
        updatedBy: user?.id || null,
        updatedByName: user?.name || user?.email || null,
      },
    });
    if (fields && typeof fields === 'object') {
      await replaceFieldValues(tx, recordId, fields);
    }
    return tx.chronicDiseaseEncounter.findUnique({
      where: { id: recordId },
      include: { fieldValues: true },
    });
  });

  return serializeRecord(record);
}

async function deleteRecord(patientId, recordId) {
  const existing = await prisma.chronicDiseaseEncounter.findFirst({
    where: { id: recordId, patientId, isDeleted: false },
  });
  if (!existing) {
    const err = new Error('Chronic disease record not found');
    err.status = 404;
    throw err;
  }
  await prisma.chronicDiseaseEncounter.update({
    where: { id: recordId },
    data: { isDeleted: true },
  });
  return { id: recordId };
}

module.exports = {
  listTemplates,
  listRecords,
  createRecord,
  updateRecord,
  deleteRecord,
};
