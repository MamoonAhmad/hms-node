const prisma = require('../lib/prisma');

const auditUserSelect = { id: true, name: true, email: true };

const auditInclude = {
  creator: { select: auditUserSelect },
  updater: { select: auditUserSelect },
  diagnosis: {
    select: { id: true, code: true, description: true },
  },
};

function parseDateInput(value) {
  if (value == null || value === '') return null;
  const d = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfDayUTC(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function serializeDate(value) {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

function serializeProblem(row) {
  if (!row) return null;
  const createdByName = row.creator?.name || row.creator?.email || null;
  const updatedByName = row.updater?.name || row.updater?.email || null;
  return {
    id: row.id,
    patientId: row.patientId,
    diagnosisId: row.diagnosisId,
    icd10Code: row.problemCode,
    diagnosisDescription: row.description,
    status: row.status,
    clinicalStatus: row.clinicalStatus,
    verificationStatus: row.verification,
    onsetDate: serializeDate(row.onsetDate),
    resolvedDate: serializeDate(row.resolvedDate),
    notes: row.notes,
    createdBy: row.createdBy,
    createdByName,
    createdAt: row.createdAt?.toISOString() || null,
    updatedBy: row.updatedBy,
    updatedByName,
    updatedAt: row.updatedAt?.toISOString() || null,
    diagnosis: row.diagnosis || null,
  };
}


async function getPatientOrThrow(patientId) {
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, deletedAt: null },
    select: { id: true, dateOfBirth: true },
  });
  if (!patient) {
    const err = new Error('Patient not found');
    err.statusCode = 404;
    throw err;
  }
  return patient;
}

async function validateDiagnosis(diagnosisId) {
  const diagnosis = await prisma.diagnosisCode.findFirst({
    where: { id: diagnosisId, deletedAt: null, isActive: true },
  });
  if (!diagnosis) {
    const err = new Error('Diagnosis code not found or inactive');
    err.statusCode = 400;
    throw err;
  }
  return diagnosis;
}

function validateDates({ onsetDate, resolvedDate, status, patientDob }) {
  const today = startOfDayUTC(new Date());
  const dob = patientDob ? startOfDayUTC(new Date(patientDob)) : null;
  const onset = onsetDate ? startOfDayUTC(onsetDate) : null;
  const resolved = resolvedDate ? startOfDayUTC(resolvedDate) : null;

  if (onset) {
    if (onset > today) {
      const err = new Error('Onset date cannot be in the future');
      err.statusCode = 400;
      throw err;
    }
    if (dob && onset < dob) {
      const err = new Error('Onset date cannot be before patient date of birth');
      err.statusCode = 400;
      throw err;
    }
  }

  if (resolved) {
    if (resolved > today) {
      const err = new Error('Resolved date cannot be in the future');
      err.statusCode = 400;
      throw err;
    }
    if (onset && resolved < onset) {
      const err = new Error('Resolved date cannot be earlier than onset date');
      err.statusCode = 400;
      throw err;
    }
  }

  if (status === 'Resolved' && !resolved) {
    const err = new Error('Resolved date is required when status is Resolved');
    err.statusCode = 400;
    throw err;
  }
}

const patientProblemService = {
  async findAll(patientId, { status = 'All' } = {}) {
    await getPatientOrThrow(patientId);

    const where = { patientId, isDeleted: false };
    if (status && status !== 'All') {
      where.status = status;
    }

    const rows = await prisma.patientProblem.findMany({
      where,
      orderBy: [{ status: 'asc' }, { onsetDate: 'desc' }, { createdAt: 'desc' }],
      include: auditInclude,
    });

    return rows.map(serializeProblem);
  },

  async findById(patientId, problemId) {
    const row = await prisma.patientProblem.findFirst({
      where: { id: problemId, patientId, isDeleted: false },
      include: auditInclude,
    });
    if (!row) {
      const err = new Error('Problem not found');
      err.statusCode = 404;
      throw err;
    }
    return serializeProblem(row);
  },

  async create(patientId, data, user) {
    const patient = await getPatientOrThrow(patientId);
    const diagnosis = await validateDiagnosis(data.diagnosisId);

    const onsetDate = parseDateInput(data.onsetDate);
    const resolvedDate = parseDateInput(data.resolvedDate);
    validateDates({
      onsetDate,
      resolvedDate,
      status: data.status || 'Active',
      patientDob: patient.dateOfBirth,
    });

    const row = await prisma.patientProblem.create({
      data: {
        patientId,
        diagnosisId: diagnosis.id,
        problemCode: diagnosis.code,
        description: data.diagnosisDescription || diagnosis.description,
        status: data.status || 'Active',
        clinicalStatus: data.clinicalStatus || 'None',
        verification: data.verificationStatus || 'None',
        onsetDate,
        resolvedDate,
        notes: data.notes?.trim() || null,
        createdBy: user?.id || null,
        updatedBy: user?.id || null,
      },
      include: auditInclude,
    });

    return serializeProblem(row);
  },

  async update(patientId, problemId, data, user) {
    const patient = await getPatientOrThrow(patientId);
    const existing = await prisma.patientProblem.findFirst({
      where: { id: problemId, patientId, isDeleted: false },
    });
    if (!existing) {
      const err = new Error('Problem not found');
      err.statusCode = 404;
      throw err;
    }

    const payload = { updatedBy: user?.id || null };

    if (data.diagnosisId !== undefined) {
      const diagnosis = await validateDiagnosis(data.diagnosisId);
      payload.diagnosisId = diagnosis.id;
      payload.problemCode = diagnosis.code;
      if (data.diagnosisDescription === undefined) {
        payload.description = diagnosis.description;
      }
    }

    if (data.diagnosisDescription !== undefined) {
      payload.description = data.diagnosisDescription.trim();
    }
    if (data.status !== undefined) payload.status = data.status;
    if (data.clinicalStatus !== undefined) payload.clinicalStatus = data.clinicalStatus;
    if (data.verificationStatus !== undefined) payload.verification = data.verificationStatus;
    if (data.notes !== undefined) payload.notes = data.notes?.trim() || null;

    const onsetDate =
      data.onsetDate !== undefined ? parseDateInput(data.onsetDate) : existing.onsetDate;
    const resolvedDate =
      data.resolvedDate !== undefined ? parseDateInput(data.resolvedDate) : existing.resolvedDate;
    const status = data.status !== undefined ? data.status : existing.status;

    validateDates({
      onsetDate,
      resolvedDate,
      status,
      patientDob: patient.dateOfBirth,
    });

    if (data.onsetDate !== undefined) payload.onsetDate = onsetDate;
    if (data.resolvedDate !== undefined) payload.resolvedDate = resolvedDate;

    const row = await prisma.patientProblem.update({
      where: { id: problemId },
      data: payload,
      include: auditInclude,
    });

    return serializeProblem(row);
  },

  async updateStatus(patientId, problemId, status, user) {
    return this.update(patientId, problemId, { status }, user);
  },

  async remove(patientId, problemId, user) {
    const existing = await prisma.patientProblem.findFirst({
      where: { id: problemId, patientId, isDeleted: false },
    });
    if (!existing) {
      const err = new Error('Problem not found');
      err.statusCode = 404;
      throw err;
    }

    await prisma.patientProblem.update({
      where: { id: problemId },
      data: {
        isDeleted: true,
        updatedBy: user?.id || null,
      },
    });

    return { success: true };
  },
};

module.exports = patientProblemService;
