const prisma = require('../lib/prisma');

const NOT_DELETED = { deletedAt: null };

const STATUS_OPTIONS = ['Active', 'Inactive', 'Resolved'];
const CLINICAL_STATUS_OPTIONS = ['None', 'Active', 'Recurrence', 'Relapse', 'Remission', 'Resolved'];
const VERIFICATION_OPTIONS = [
  'None',
  'Unconfirmed',
  'Provisional',
  'Differential',
  'Confirmed',
  'Refuted',
  'Entered in Error',
];
const PROBLEM_TYPE_OPTIONS = ['Acute', 'Chronic', 'Both'];
const ACUITY_OPTIONS = ['Mild', 'Moderate', 'Severe'];

const auditUserSelect = { id: true, name: true, email: true };

const auditInclude = {
  creator: { select: auditUserSelect },
  updater: { select: auditUserSelect },
  diagnosis: {
    select: { id: true, code: true, description: true, isActive: true },
  },
};

function parseDateInput(value) {
  if (value == null || value === '') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfDay(date) {
  const d = parseDateInput(date);
  if (!d) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

function emptyToNull(value) {
  if (value == null || String(value).trim() === '') return null;
  return String(value).trim();
}

function normalizeClinicalStatus(value) {
  const v = emptyToNull(value);
  if (!v || v === 'None') return null;
  return CLINICAL_STATUS_OPTIONS.includes(v) ? v : null;
}

function normalizeVerification(value) {
  const v = emptyToNull(value);
  if (!v || v === 'None') return null;
  return VERIFICATION_OPTIONS.includes(v) ? v : null;
}

function serializeRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    patientId: row.patientId,
    diagnosisId: row.diagnosisId,
    icd10Code: row.icd10Code,
    diagnosisDescription: row.diagnosisDescription,
    status: row.status,
    clinicalStatus: row.clinicalStatus,
    verificationStatus: row.verificationStatus,
    problemType: row.problemType,
    acuity: row.acuity,
    onsetDate: row.onsetDate ? row.onsetDate.toISOString().slice(0, 10) : null,
    resolvedDate: row.resolvedDate ? row.resolvedDate.toISOString().slice(0, 10) : null,
    notes: row.notes,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    createdByName: row.creator?.name || row.creator?.email || '—',
    updatedByName: row.updater?.name || row.updater?.email || '—',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    diagnosis: row.diagnosis
      ? {
          id: row.diagnosis.id,
          code: row.diagnosis.code,
          description: row.diagnosis.description,
        }
      : null,
  };
}

async function assertPatientExists(patientId) {
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

async function assertDiagnosisExists(diagnosisId) {
  if (!diagnosisId) return null;
  const diagnosis = await prisma.diagnosisCode.findFirst({
    where: { id: diagnosisId, deletedAt: null, isActive: true },
    select: { id: true, code: true, description: true },
  });
  if (!diagnosis) {
    const err = new Error('Diagnosis code not found or inactive');
    err.statusCode = 400;
    throw err;
  }
  return diagnosis;
}

function validateDates({ onsetDate, resolvedDate, status, patientDob }) {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const onset = startOfDay(onsetDate);
  const resolved = startOfDay(resolvedDate);

  if (onset && onset > today) {
    const err = new Error('Onset Date cannot be a future date');
    err.statusCode = 400;
    throw err;
  }

  if (patientDob && onset) {
    const dob = startOfDay(patientDob);
    if (dob && onset < dob) {
      const err = new Error('Onset Date cannot be earlier than patient date of birth');
      err.statusCode = 400;
      throw err;
    }
  }

  if (resolved && resolved > today) {
    const err = new Error('Resolved Date cannot be a future date');
    err.statusCode = 400;
    throw err;
  }

  if (onset && resolved && resolved < onset) {
    const err = new Error('Resolved Date cannot be earlier than Onset Date');
    err.statusCode = 400;
    throw err;
  }

  if (status === 'Resolved' && !resolved) {
    const err = new Error('Resolved Date is required when status is Resolved');
    err.statusCode = 400;
    throw err;
  }
}

const patientProblemService = {
  STATUS_OPTIONS,
  CLINICAL_STATUS_OPTIONS,
  VERIFICATION_OPTIONS,

  async findAll(patientId, { status = '' } = {}) {
    await assertPatientExists(patientId);

    const conditions = [{ patientId }, NOT_DELETED];
    if (status && STATUS_OPTIONS.includes(status)) {
      conditions.push({ status });
    }

    const rows = await prisma.patientProblem.findMany({
      where: { AND: conditions },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: auditInclude,
    });

    return rows.map(serializeRow);
  },

  async findById(patientId, problemId) {
    const row = await prisma.patientProblem.findFirst({
      where: { id: problemId, patientId, ...NOT_DELETED },
      include: auditInclude,
    });
    return serializeRow(row);
  },

  async create(patientId, data, userId) {
    const patient = await assertPatientExists(patientId);

    const diagnosisId = emptyToNull(data.diagnosisId);
    const diagnosis = await assertDiagnosisExists(diagnosisId);

    const icd10Code = diagnosis
      ? diagnosis.code
      : emptyToNull(data.icd10Code);
    const diagnosisDescription = diagnosis
      ? diagnosis.description
      : String(data.diagnosisDescription || '').trim();

    if (!diagnosisId && !diagnosisDescription) {
      const err = new Error('Diagnosis selection is required');
      err.statusCode = 400;
      throw err;
    }

    const status = STATUS_OPTIONS.includes(data.status) ? data.status : 'Active';
    const onsetDate = parseDateInput(data.onsetDate);
    const resolvedDate = parseDateInput(data.resolvedDate);

    validateDates({
      onsetDate,
      resolvedDate,
      status,
      patientDob: patient.dateOfBirth,
    });

    const row = await prisma.patientProblem.create({
      data: {
        patientId,
        diagnosisId: diagnosis?.id || null,
        icd10Code,
        diagnosisDescription,
        status,
        clinicalStatus: normalizeClinicalStatus(data.clinicalStatus),
        verificationStatus: normalizeVerification(data.verificationStatus),
        problemType: PROBLEM_TYPE_OPTIONS.includes(data.problemType) ? data.problemType : null,
        acuity: ACUITY_OPTIONS.includes(data.acuity) ? data.acuity : null,
        onsetDate,
        resolvedDate,
        notes: data.notes ? String(data.notes).trim().slice(0, 2000) : null,
        createdBy: userId,
        updatedBy: userId,
      },
      include: auditInclude,
    });

    return serializeRow(row);
  },

  async update(patientId, problemId, data, userId) {
    const existing = await this.findById(patientId, problemId);
    if (!existing) {
      const err = new Error('Problem not found');
      err.statusCode = 404;
      throw err;
    }

    const patient = await assertPatientExists(patientId);
    const payload = { updatedBy: userId };

    if (data.diagnosisId !== undefined) {
      const diagnosisId = emptyToNull(data.diagnosisId);
      const diagnosis = await assertDiagnosisExists(diagnosisId);
      payload.diagnosisId = diagnosis?.id || null;
      if (diagnosis) {
        payload.icd10Code = diagnosis.code;
        payload.diagnosisDescription = diagnosis.description;
      }
    }

    if (data.icd10Code !== undefined && data.diagnosisId === undefined) {
      payload.icd10Code = emptyToNull(data.icd10Code);
    }
    if (data.diagnosisDescription !== undefined && data.diagnosisId === undefined) {
      const desc = String(data.diagnosisDescription).trim();
      if (!desc) {
        const err = new Error('Diagnosis description is required');
        err.statusCode = 400;
        throw err;
      }
      payload.diagnosisDescription = desc;
    }

    if (data.status !== undefined) {
      if (!STATUS_OPTIONS.includes(data.status)) {
        const err = new Error('Invalid status value');
        err.statusCode = 400;
        throw err;
      }
      payload.status = data.status;
    }

    if (data.clinicalStatus !== undefined) {
      payload.clinicalStatus = normalizeClinicalStatus(data.clinicalStatus);
    }

    if (data.verificationStatus !== undefined) {
      payload.verificationStatus = normalizeVerification(data.verificationStatus);
    }

    if (data.problemType !== undefined) {
      const v = emptyToNull(data.problemType);
      payload.problemType = PROBLEM_TYPE_OPTIONS.includes(v) ? v : null;
    }

    if (data.acuity !== undefined) {
      const v = emptyToNull(data.acuity);
      payload.acuity = ACUITY_OPTIONS.includes(v) ? v : null;
    }

    if (data.onsetDate !== undefined) {
      payload.onsetDate = parseDateInput(data.onsetDate);
    }

    if (data.resolvedDate !== undefined) {
      payload.resolvedDate = parseDateInput(data.resolvedDate);
    }

    if (data.notes !== undefined) {
      payload.notes = data.notes ? String(data.notes).trim().slice(0, 2000) : null;
    }

    const nextStatus = payload.status ?? existing.status;
    const nextOnset = payload.onsetDate !== undefined ? payload.onsetDate : existing.onsetDate;
    const nextResolved =
      payload.resolvedDate !== undefined ? payload.resolvedDate : existing.resolvedDate;

    validateDates({
      onsetDate: nextOnset,
      resolvedDate: nextResolved,
      status: nextStatus,
      patientDob: patient.dateOfBirth,
    });

    const row = await prisma.patientProblem.update({
      where: { id: problemId },
      data: payload,
      include: auditInclude,
    });

    return serializeRow(row);
  },

  async updateStatus(patientId, problemId, status, userId, extras = {}) {
    if (!STATUS_OPTIONS.includes(status)) {
      const err = new Error('Invalid status value');
      err.statusCode = 400;
      throw err;
    }
    const payload = { status };
    if (status === 'Resolved') {
      payload.resolvedDate = extras.resolvedDate || new Date().toISOString().slice(0, 10);
    }
    if (status === 'Active' || status === 'Inactive') {
      if (extras.resolvedDate !== undefined) {
        payload.resolvedDate = extras.resolvedDate;
      }
    }
    return this.update(patientId, problemId, payload, userId);
  },

  async delete(patientId, problemId, userId) {
    const existing = await this.findById(patientId, problemId);
    if (!existing) {
      const err = new Error('Problem not found');
      err.statusCode = 404;
      throw err;
    }

    await prisma.patientProblem.update({
      where: { id: problemId },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
        updatedBy: userId,
      },
    });

    return { success: true, message: 'Problem removed successfully' };
  },
};

module.exports = patientProblemService;
