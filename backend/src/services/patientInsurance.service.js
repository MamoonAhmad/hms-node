const prisma = require('../lib/prisma');

function httpError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

const COB = { primary: 1, secondary: 2, tertiary: 3 };

function normalizeType(value) {
  const raw = String(value || 'primary').toLowerCase().replace(/\s+/g, '_');
  if (raw.includes('secondary')) return 'secondary';
  if (raw.includes('tertiary')) return 'tertiary';
  return 'primary';
}

function mapPayload(body) {
  const insuranceType = normalizeType(body.insuranceType || body.insuranceTypeKey);
  return {
    insuranceType,
    insuranceProviderId: body.insuranceProviderId,
    memberId: String(body.memberId || '').trim(),
    policyType: body.policyType || null,
    planName: body.planName || null,
    groupNumber: body.groupNumber || null,
    subscriberFirstName: body.subscriberFirstName || null,
    subscriberLastName: body.subscriberLastName || null,
    subscriberRelationship: body.subscriberRelationship || null,
    subscriberGender: body.subscriberGender || null,
    subscriberDateOfBirth: body.subscriberDateOfBirth ? new Date(body.subscriberDateOfBirth) : null,
    subscriberPhone: body.subscriberPhone || null,
    subscriberEmail: body.subscriberEmail || null,
    subscriberSsnLast4: body.subscriberSsnLast4 || null,
    subscriberEmployer: body.subscriberEmployer || null,
    subscriberStreetAddress: body.subscriberStreetAddress || body.subscriberAddress || null,
    subscriberCity: body.subscriberCity || null,
    subscriberState: body.subscriberState || null,
    subscriberZip: body.subscriberZip || null,
    coverageStartDate: body.coverageStartDate ? new Date(body.coverageStartDate) : null,
    coverageEndDate: body.coverageEndDate ? new Date(body.coverageEndDate) : null,
    coinsurancePercentage: body.coinsurancePercentage != null ? body.coinsurancePercentage : null,
    copay: body.copay != null ? body.copay : null,
    deductible: body.deductible != null ? body.deductible : null,
    authorizationNumber: body.authorizationNumber || null,
    authorizationRequired: body.authorizationRequired || null,
    claimNumber: body.claimNumber || null,
    isActive: body.isActive !== false,
    cobOrder: body.cobOrder != null ? parseInt(body.cobOrder, 10) : COB[insuranceType] || 1,
    notes: body.notes || null,
  };
}

const patientInsuranceService = {
  async list(patientId) {
    return prisma.patientInsurance.findMany({
      where: { patientId },
      include: { insuranceProvider: { select: { id: true, name: true } } },
      orderBy: [{ cobOrder: 'asc' }, { insuranceType: 'asc' }],
    });
  },

  async create(patientId, body, user) {
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient || patient.deletedAt) throw httpError('Patient not found', 404);

    const data = mapPayload(body);
    if (!data.insuranceProviderId) throw httpError('insuranceProviderId is required');
    if (!data.memberId) throw httpError('memberId is required');

    const provider = await prisma.insuranceProvider.findFirst({
      where: { id: data.insuranceProviderId, deletedAt: null },
    });
    if (!provider) throw httpError('Insurance provider not found', 404);

    const existing = await prisma.patientInsurance.findFirst({
      where: { patientId, insuranceType: data.insuranceType },
    });
    if (existing) {
      throw httpError(`${data.insuranceType} insurance already exists; update it instead`);
    }

    const row = await prisma.patientInsurance.create({
      data: { ...data, patientId },
      include: { insuranceProvider: { select: { id: true, name: true } } },
    });

    if (data.insuranceType === 'primary') {
      await prisma.patient.update({
        where: { id: patientId },
        data: {
          insuranceProviderId: data.insuranceProviderId,
          policyNumber: data.memberId,
          copay: data.copay,
          deductible: data.deductible,
          updatedBy: user?.id || null,
        },
      });
    }

    return row;
  },

  async update(patientId, insuranceId, body, user) {
    const existing = await prisma.patientInsurance.findFirst({
      where: { id: insuranceId, patientId },
    });
    if (!existing) throw httpError('Insurance record not found', 404);

    const data = mapPayload({ ...existing, ...body });
    if (body.insuranceProviderId) {
      const provider = await prisma.insuranceProvider.findFirst({
        where: { id: body.insuranceProviderId, deletedAt: null },
      });
      if (!provider) throw httpError('Insurance provider not found', 404);
    }

    if (data.insuranceType !== existing.insuranceType) {
      const clash = await prisma.patientInsurance.findFirst({
        where: {
          patientId,
          insuranceType: data.insuranceType,
          NOT: { id: insuranceId },
        },
      });
      if (clash) throw httpError(`${data.insuranceType} insurance already exists`);
    }

    const row = await prisma.patientInsurance.update({
      where: { id: insuranceId },
      data,
      include: { insuranceProvider: { select: { id: true, name: true } } },
    });

    if (row.insuranceType === 'primary' && row.isActive) {
      await prisma.patient.update({
        where: { id: patientId },
        data: {
          insuranceProviderId: row.insuranceProviderId,
          policyNumber: row.memberId,
          copay: row.copay,
          deductible: row.deductible,
          updatedBy: user?.id || null,
        },
      });
    }

    return row;
  },

  async deactivate(patientId, insuranceId, user) {
    const existing = await prisma.patientInsurance.findFirst({
      where: { id: insuranceId, patientId },
    });
    if (!existing) throw httpError('Insurance record not found', 404);
    return prisma.patientInsurance.update({
      where: { id: insuranceId },
      data: { isActive: false },
      include: { insuranceProvider: { select: { id: true, name: true } } },
    });
  },
};

module.exports = patientInsuranceService;
