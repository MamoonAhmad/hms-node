const prisma = require('../lib/prisma');

const NOT_DELETED = { deletedAt: null };

function httpError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function serializeProblem(row) {
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
  };
}

function serializeEncounterRow(ep, problem) {
  return {
    id: ep?.id || null,
    appointmentId: ep?.appointmentId || null,
    patientId: problem.patientId,
    problemId: problem.id,
    addressedThisVisit: !!ep?.addressedThisVisit,
    isPrimary: !!ep?.isPrimary,
    priority: ep?.priority ?? null,
    assessment: ep?.assessment || null,
    plan: ep?.plan || null,
    createdAt: ep?.createdAt || null,
    updatedAt: ep?.updatedAt || null,
    problem: serializeProblem(problem),
  };
}

async function assertPatientAppointment(patientId, appointmentId) {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, patientId },
    select: { id: true, patientId: true, appointmentDate: true },
  });
  if (!appointment) {
    throw httpError('Appointment not found for this patient', 404);
  }
  return appointment;
}

async function assertPatientProblem(patientId, problemId) {
  const problem = await prisma.patientProblem.findFirst({
    where: { id: problemId, patientId, ...NOT_DELETED },
  });
  if (!problem) {
    throw httpError('Problem not found', 404);
  }
  return problem;
}

async function clearOtherPrimary(tx, appointmentId, exceptProblemId) {
  await tx.encounterProblem.updateMany({
    where: {
      appointmentId,
      isPrimary: true,
      ...(exceptProblemId ? { problemId: { not: exceptProblemId } } : {}),
    },
    data: { isPrimary: false },
  });
}

const encounterProblemService = {
  async listForAppointment(patientId, appointmentId) {
    await assertPatientAppointment(patientId, appointmentId);

    const [problems, encounterRows] = await Promise.all([
      prisma.patientProblem.findMany({
        where: { patientId, ...NOT_DELETED },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.encounterProblem.findMany({
        where: { patientId, appointmentId },
      }),
    ]);

    const byProblemId = new Map(encounterRows.map((r) => [r.problemId, r]));

    const items = problems.map((problem) =>
      serializeEncounterRow(byProblemId.get(problem.id), problem),
    );

    items.sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
      if (a.addressedThisVisit !== b.addressedThisVisit) return a.addressedThisVisit ? -1 : 1;
      const ap = a.priority ?? 999;
      const bp = b.priority ?? 999;
      if (ap !== bp) return ap - bp;
      const aActive = a.problem?.status === 'Active' ? 0 : 1;
      const bActive = b.problem?.status === 'Active' ? 0 : 1;
      return aActive - bActive;
    });

    return {
      appointmentId,
      patientId,
      items,
      addressedCount: items.filter((i) => i.addressedThisVisit).length,
      primaryProblemId: items.find((i) => i.isPrimary)?.problemId || null,
    };
  },

  async upsert(patientId, appointmentId, problemId, data, userId) {
    await assertPatientAppointment(patientId, appointmentId);
    const problem = await assertPatientProblem(patientId, problemId);

    const addressedThisVisit =
      data.addressedThisVisit !== undefined ? !!data.addressedThisVisit : undefined;
    let isPrimary = data.isPrimary !== undefined ? !!data.isPrimary : undefined;

    if (isPrimary === true && addressedThisVisit === false) {
      throw httpError('Primary diagnosis must be addressed this visit');
    }

    const row = await prisma.$transaction(async (tx) => {
      const existing = await tx.encounterProblem.findUnique({
        where: {
          appointmentId_problemId: { appointmentId, problemId },
        },
      });

      const nextAddressed =
        addressedThisVisit !== undefined
          ? addressedThisVisit
          : existing
            ? existing.addressedThisVisit
            : false;

      if (isPrimary === true) {
        await clearOtherPrimary(tx, appointmentId, problemId);
      }

      // Clearing addressed also clears primary
      if (addressedThisVisit === false) {
        isPrimary = false;
      }

      // Setting primary implies addressed
      const finalAddressed = isPrimary === true ? true : nextAddressed;
      const finalPrimary =
        isPrimary !== undefined
          ? isPrimary
          : existing
            ? existing.isPrimary && finalAddressed
            : false;

      const payload = {
        addressedThisVisit: finalAddressed,
        isPrimary: finalPrimary && finalAddressed,
        updatedBy: userId,
      };

      if (data.priority !== undefined) {
        payload.priority = data.priority == null ? null : Number(data.priority);
      }
      if (data.assessment !== undefined) {
        payload.assessment = data.assessment ? String(data.assessment).trim() : null;
      }
      if (data.plan !== undefined) {
        payload.plan = data.plan ? String(data.plan).trim() : null;
      }

      if (existing) {
        return tx.encounterProblem.update({
          where: { id: existing.id },
          data: payload,
        });
      }

      return tx.encounterProblem.create({
        data: {
          appointmentId,
          patientId,
          problemId,
          addressedThisVisit: payload.addressedThisVisit,
          isPrimary: payload.isPrimary,
          priority: payload.priority ?? null,
          assessment: payload.assessment ?? null,
          plan: payload.plan ?? null,
          createdBy: userId,
          updatedBy: userId,
        },
      });
    });

    return serializeEncounterRow(row, problem);
  },

  async setPrimary(patientId, appointmentId, problemId, userId) {
    return this.upsert(
      patientId,
      appointmentId,
      problemId,
      { isPrimary: true, addressedThisVisit: true },
      userId,
    );
  },

  /**
   * Push addressed encounter problems into draft charge-capture diagnoses.
   * Preserves manually entered diagnoses that have no problemId.
   */
  async syncToChargeCapture(patientId, appointmentId, userId) {
    await assertPatientAppointment(patientId, appointmentId);

    const capture = await prisma.encounterChargeCapture.findUnique({
      where: { appointmentId },
      include: { diagnoses: { orderBy: { sequence: 'asc' } } },
    });

    if (capture?.isLocked) {
      throw httpError('Charge capture is locked; unlock before syncing diagnoses', 409);
    }

    const encounterRows = await prisma.encounterProblem.findMany({
      where: { patientId, appointmentId, addressedThisVisit: true },
      include: { problem: true },
      orderBy: [{ isPrimary: 'desc' }, { priority: 'asc' }, { createdAt: 'asc' }],
    });

    const addressed = encounterRows
      .filter((r) => r.problem && !r.problem.deletedAt && r.problem.icd10Code)
      .sort((a, b) => {
        if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
        const ap = a.priority ?? 999;
        const bp = b.priority ?? 999;
        return ap - bp;
      });

    const fromProblems = addressed.slice(0, 12).map((r, idx) => ({
      sequence: idx + 1,
      icd10Code: r.problem.icd10Code.trim().toUpperCase(),
      description: r.problem.diagnosisDescription || null,
      diagnosisCodeId: r.problem.diagnosisId || null,
      problemId: r.problemId,
      isPrimary: !!r.isPrimary || idx === 0,
    }));

    // Ensure exactly one primary
    const primaryIdx = fromProblems.findIndex((d) => d.isPrimary);
    const normalized = fromProblems.map((d, idx) => ({
      ...d,
      isPrimary: primaryIdx >= 0 ? idx === primaryIdx : idx === 0,
    }));

    if (!capture) {
      if (!normalized.length) {
        return { synced: false, reason: 'No addressed problems with ICD codes', diagnoses: [] };
      }
      const created = await prisma.encounterChargeCapture.create({
        data: {
          patientId,
          appointmentId,
          status: 'draft',
          placeOfService: '11',
          dateOfService: new Date(),
          createdBy: userId,
          updatedBy: userId,
          diagnoses: { create: normalized },
        },
        include: { diagnoses: { orderBy: { sequence: 'asc' } } },
      });
      return {
        synced: true,
        chargeCaptureId: created.id,
        diagnoses: created.diagnoses,
      };
    }

    const manualDiagnoses = (capture.diagnoses || [])
      .filter((d) => !d.problemId)
      .map((d) => ({
        icd10Code: d.icd10Code,
        description: d.description,
        diagnosisCodeId: d.diagnosisCodeId,
        problemId: null,
        isPrimary: false,
      }));

    const problemCodes = new Set(normalized.map((d) => d.icd10Code));
    const extras = manualDiagnoses.filter((d) => !problemCodes.has(String(d.icd10Code || '').toUpperCase()));

    const merged = [...normalized, ...extras]
      .slice(0, 12)
      .map((d, idx) => ({
        sequence: idx + 1,
        icd10Code: String(d.icd10Code).trim().toUpperCase(),
        description: d.description || null,
        diagnosisCodeId: d.diagnosisCodeId || null,
        problemId: d.problemId || null,
        isPrimary: false,
      }));

    if (merged.length) {
      const pIdx = merged.findIndex((d) => d.problemId && normalized.some((n) => n.problemId === d.problemId && n.isPrimary));
      merged.forEach((d, idx) => {
        d.isPrimary = pIdx >= 0 ? idx === pIdx : idx === 0;
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.encounterDiagnosis.deleteMany({ where: { chargeCaptureId: capture.id } });
      if (merged.length) {
        await tx.encounterDiagnosis.createMany({
          data: merged.map((d) => ({
            chargeCaptureId: capture.id,
            ...d,
          })),
        });
      }
      await tx.encounterChargeCapture.update({
        where: { id: capture.id },
        data: { updatedBy: userId },
      });
    });

    const diagnoses = await prisma.encounterDiagnosis.findMany({
      where: { chargeCaptureId: capture.id },
      orderBy: { sequence: 'asc' },
    });

    return {
      synced: true,
      chargeCaptureId: capture.id,
      diagnoses,
    };
  },

  async getAddressedForPrefill(patientId, appointmentId) {
    await assertPatientAppointment(patientId, appointmentId);
    const rows = await prisma.encounterProblem.findMany({
      where: { patientId, appointmentId, addressedThisVisit: true },
      include: { problem: true },
      orderBy: [{ isPrimary: 'desc' }, { priority: 'asc' }, { createdAt: 'asc' }],
    });

    return rows
      .filter((r) => r.problem && !r.problem.deletedAt)
      .map((r) => ({
        ...serializeEncounterRow(r, r.problem),
        icd10Code: r.problem.icd10Code,
        diagnosisDescription: r.problem.diagnosisDescription,
        status: r.problem.status,
        diagnosisId: r.problem.diagnosisId,
      }));
  },
};

module.exports = encounterProblemService;
