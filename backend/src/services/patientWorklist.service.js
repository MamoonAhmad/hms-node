const prisma = require('../lib/prisma');
const patientLedgerService = require('./patientLedger.service');

function daysSince(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

const patientWorklistService = {
  async getWorklists({ limit = 50 } = {}) {
    const take = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);

    const patients = await prisma.patient.findMany({
      where: { deletedAt: null, mergedIntoId: null },
      take: 500,
      orderBy: { updatedAt: 'desc' },
      include: {
        insurances: {
          include: { insuranceProvider: { select: { name: true } } },
        },
        eligibilityChecks: {
          orderBy: { verifiedAt: 'desc' },
          take: 1,
        },
      },
    });

    const withBalance = [];
    const expiredCoverage = [];
    const unverifiedEligibility = [];
    const incompleteRegistration = [];
    const collections = [];

    for (const patient of patients) {
      const balance = Number(patient.accountBalance || 0);
      const item = {
        id: patient.id,
        mrn: patient.mrn,
        firstName: patient.firstName,
        lastName: patient.lastName,
        registrationStatus: patient.registrationStatus,
        billingType: patient.billingType,
        chartStatus: patient.chartStatus,
        financialClass: patient.financialClass,
        collectionStatus: patient.collectionStatus,
        accountBalance: balance,
        lastEligibilityAt: patient.lastEligibilityAt,
      };

      if (balance > 0) withBalance.push(item);

      const activeIns = (patient.insurances || []).filter((i) => i.isActive !== false);
      const expired = activeIns.some(
        (ins) => ins.coverageEndDate && new Date(ins.coverageEndDate) < new Date(),
      );
      if (expired) expiredCoverage.push(item);

      const billingType = String(patient.billingType || '').replace('_', '-');
      if (billingType === 'insurance' || billingType === 'Insurance') {
        const latest = patient.eligibilityChecks?.[0];
        const age = daysSince(latest?.verifiedAt || patient.lastEligibilityAt);
        if (!latest || (age != null && age > 14)) {
          unverifiedEligibility.push(item);
        }
        if (!activeIns.some((i) => i.insuranceType === 'primary')) {
          incompleteRegistration.push({ ...item, reason: 'missing_primary_insurance' });
        }
      }

      if (['pending', 'draft'].includes(String(patient.registrationStatus || '').toLowerCase())) {
        incompleteRegistration.push({ ...item, reason: 'registration_incomplete' });
      }

      if (['active', 'agency', 'dunning'].includes(String(patient.collectionStatus || '').toLowerCase())) {
        collections.push(item);
      }
    }

    // Enrich top balances with aging when requested lightly
    const balanceDue = withBalance
      .sort((a, b) => b.accountBalance - a.accountBalance)
      .slice(0, take);

    return {
      balanceDue,
      expiredCoverage: expiredCoverage.slice(0, take),
      unverifiedEligibility: unverifiedEligibility.slice(0, take),
      incompleteRegistration: incompleteRegistration.slice(0, take),
      collections: collections.slice(0, take),
      counts: {
        balanceDue: withBalance.length,
        expiredCoverage: expiredCoverage.length,
        unverifiedEligibility: unverifiedEligibility.length,
        incompleteRegistration: incompleteRegistration.length,
        collections: collections.length,
      },
    };
  },

  async updateCollectionStatus(patientId, body, user) {
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient || patient.deletedAt) {
      const err = new Error('Patient not found');
      err.statusCode = 404;
      throw err;
    }
    return prisma.patient.update({
      where: { id: patientId },
      data: {
        collectionStatus: body.collectionStatus || 'none',
        collectionNotes: body.collectionNotes || null,
        updatedBy: user?.id || null,
      },
      select: {
        id: true,
        collectionStatus: true,
        collectionNotes: true,
        accountBalance: true,
      },
    });
  },
};

module.exports = patientWorklistService;
