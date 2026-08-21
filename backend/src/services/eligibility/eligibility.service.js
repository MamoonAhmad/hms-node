const prisma = require('../../lib/prisma');
const eligibilityProviderRegistry = require('./eligibilityProvider');

function httpError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function toNumber(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const eligibilityService = {
  async verifyForAppointment(appointmentId, body = {}, user) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        appointmentTypeRef: true,
        primaryInsurance: { include: { insuranceProvider: true } },
      },
    });
    if (!appointment) throw httpError('Appointment not found', 404);

    let insurance = appointment.primaryInsurance;
    if (body.patientInsuranceId) {
      insurance = await prisma.patientInsurance.findFirst({
        where: { id: body.patientInsuranceId, patientId: appointment.patientId },
        include: { insuranceProvider: true },
      });
      if (!insurance) throw httpError('Patient insurance not found', 404);
    }
    if (!insurance) {
      insurance = await prisma.patientInsurance.findFirst({
        where: { patientId: appointment.patientId, insuranceType: 'primary' },
        include: { insuranceProvider: true },
      });
    }

    const provider = eligibilityProviderRegistry.getProvider();
    const result = await provider.verify({
      patient: appointment.patient,
      insurance,
      appointment,
    });

    const row = await prisma.insuranceEligibility.create({
      data: {
        patientId: appointment.patientId,
        appointmentId: appointment.id,
        patientInsuranceId: insurance?.id || null,
        insuranceProviderId: insurance?.insuranceProviderId || null,
        status: result.status || 'Not Verified',
        coverageStatus: result.coverageStatus || null,
        verifiedAt: new Date(),
        verificationSource: body.source || provider.name,
        payerName: result.payerName || null,
        memberId: result.memberId || null,
        groupNumber: result.groupNumber || null,
        subscriberFirstName: result.subscriberFirstName || null,
        subscriberLastName: result.subscriberLastName || null,
        subscriberRelationship: result.subscriberRelationship || null,
        effectiveDate: result.effectiveDate ? new Date(result.effectiveDate) : null,
        terminationDate: result.terminationDate ? new Date(result.terminationDate) : null,
        copay: toNumber(result.copay),
        coinsurancePercentage: toNumber(result.coinsurancePercentage),
        deductible: toNumber(result.deductible),
        deductibleRemaining: toNumber(result.deductibleRemaining),
        outOfPocketMax: toNumber(result.outOfPocketMax),
        outOfPocketRemaining: toNumber(result.outOfPocketRemaining),
        referralRequired: !!result.referralRequired,
        priorAuthRequired: !!result.priorAuthRequired,
        benefitsSummary: result.benefitsSummary || undefined,
        requestPayload: result.requestPayload || undefined,
        responsePayload: result.responsePayload || undefined,
        externalTraceId: result.externalTraceId || null,
        notes: body.notes || null,
        createdBy: user?.id || null,
      },
    });

    const rcmStatus =
      result.status === 'Active' || result.coverageStatus === 'Active'
        ? result.priorAuthRequired
          ? 'Authorization Pending'
          : 'Eligibility Verified'
        : 'Eligibility Pending';

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        latestEligibilityId: row.id,
        primaryInsuranceId: insurance?.id || appointment.primaryInsuranceId,
        rcmStatus,
        updatedBy: user?.id || null,
      },
    });

    await prisma.appointmentHistory.create({
      data: {
        appointmentId,
        action: 'eligibility_verified',
        summary: `Eligibility ${row.status} via ${row.verificationSource}`,
        changes: [{ field: 'eligibility', to: row.status }],
        changedBy: user?.id || null,
        changedByName: user?.name || user?.email || null,
      },
    });

    return row;
  },

  async listForAppointment(appointmentId) {
    return prisma.insuranceEligibility.findMany({
      where: { appointmentId },
      orderBy: { verifiedAt: 'desc' },
    });
  },

  async verifyForPatient(patientId, body = {}, user) {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, deletedAt: null },
    });
    if (!patient) throw httpError('Patient not found', 404);

    let insurance = null;
    if (body.patientInsuranceId) {
      insurance = await prisma.patientInsurance.findFirst({
        where: { id: body.patientInsuranceId, patientId },
        include: { insuranceProvider: true },
      });
      if (!insurance) throw httpError('Patient insurance not found', 404);
    }
    if (!insurance) {
      insurance = await prisma.patientInsurance.findFirst({
        where: { patientId, insuranceType: 'primary' },
        include: { insuranceProvider: true },
      });
    }

    const provider = eligibilityProviderRegistry.getProvider();
    const result = await provider.verify({
      patient,
      insurance,
      appointment: null,
    });

    const row = await prisma.insuranceEligibility.create({
      data: {
        patientId,
        appointmentId: body.appointmentId || null,
        patientInsuranceId: insurance?.id || null,
        insuranceProviderId: insurance?.insuranceProviderId || null,
        status: result.status || 'Not Verified',
        coverageStatus: result.coverageStatus || null,
        verifiedAt: new Date(),
        verificationSource: body.source || provider.name,
        payerName: result.payerName || null,
        memberId: result.memberId || null,
        groupNumber: result.groupNumber || null,
        subscriberFirstName: result.subscriberFirstName || null,
        subscriberLastName: result.subscriberLastName || null,
        subscriberRelationship: result.subscriberRelationship || null,
        effectiveDate: result.effectiveDate ? new Date(result.effectiveDate) : null,
        terminationDate: result.terminationDate ? new Date(result.terminationDate) : null,
        copay: toNumber(result.copay),
        coinsurancePercentage: toNumber(result.coinsurancePercentage),
        deductible: toNumber(result.deductible),
        deductibleRemaining: toNumber(result.deductibleRemaining),
        outOfPocketMax: toNumber(result.outOfPocketMax),
        outOfPocketRemaining: toNumber(result.outOfPocketRemaining),
        referralRequired: !!result.referralRequired,
        priorAuthRequired: !!result.priorAuthRequired,
        benefitsSummary: result.benefitsSummary || undefined,
        requestPayload: result.requestPayload || undefined,
        responsePayload: result.responsePayload || undefined,
        externalTraceId: result.externalTraceId || null,
        notes: body.notes || null,
        createdBy: user?.id || null,
      },
    });

    await prisma.patient.update({
      where: { id: patientId },
      data: { lastEligibilityAt: row.verifiedAt, updatedBy: user?.id || null },
    });

    return row;
  },

  async listForPatient(patientId) {
    return prisma.insuranceEligibility.findMany({
      where: { patientId },
      orderBy: { verifiedAt: 'desc' },
      take: 25,
    });
  },

  async getLatest(appointmentId) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { latestEligibility: true },
    });
    if (!appointment) return null;
    if (appointment.latestEligibility) return appointment.latestEligibility;
    return prisma.insuranceEligibility.findFirst({
      where: { appointmentId },
      orderBy: { verifiedAt: 'desc' },
    });
  },
};

module.exports = eligibilityService;
