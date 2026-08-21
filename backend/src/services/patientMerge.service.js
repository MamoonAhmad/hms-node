const prisma = require('../lib/prisma');

function httpError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

const patientMergeService = {
  async merge(sourcePatientId, targetPatientId, user, notes) {
    if (!sourcePatientId || !targetPatientId) {
      throw httpError('sourcePatientId and targetPatientId are required');
    }
    if (sourcePatientId === targetPatientId) {
      throw httpError('Cannot merge a patient into itself');
    }

    const [source, target] = await Promise.all([
      prisma.patient.findUnique({ where: { id: sourcePatientId } }),
      prisma.patient.findUnique({ where: { id: targetPatientId } }),
    ]);
    if (!source || source.deletedAt) throw httpError('Source patient not found', 404);
    if (!target || target.deletedAt) throw httpError('Target patient not found', 404);
    if (source.mergedIntoId) throw httpError('Source patient was already merged');

    const counts = await prisma.$transaction(async (tx) => {
      const appointments = await tx.appointment.updateMany({
        where: { patientId: sourcePatientId },
        data: { patientId: targetPatientId },
      });
      const waitlist = await tx.waitlistEntry.updateMany({
        where: { patientId: sourcePatientId },
        data: { patientId: targetPatientId },
      });
      const ledger = await tx.ledgerTransaction.updateMany({
        where: { patientId: sourcePatientId },
        data: { patientId: targetPatientId },
      });
      const payments = await tx.appointmentPayment.updateMany({
        where: { patientId: sourcePatientId },
        data: { patientId: targetPatientId },
      });
      const documents = await tx.patientDocument.updateMany({
        where: { patientId: sourcePatientId },
        data: { patientId: targetPatientId },
      });
      const consents = await tx.patientConsentSignature.updateMany({
        where: { patientId: sourcePatientId },
        data: { patientId: targetPatientId },
      });
      const eligibility = await tx.insuranceEligibility.updateMany({
        where: { patientId: sourcePatientId },
        data: { patientId: targetPatientId },
      });
      const statements = await tx.patientStatement.updateMany({
        where: { patientId: sourcePatientId },
        data: { patientId: targetPatientId },
      });
      const claims = await tx.patientClaim.updateMany({
        where: { patientId: sourcePatientId },
        data: { patientId: targetPatientId },
      });
      const auths = await tx.priorAuthorization.updateMany({
        where: { patientId: sourcePatientId },
        data: { patientId: targetPatientId },
      });
      const referrals = await tx.referralRecord.updateMany({
        where: { patientId: sourcePatientId },
        data: { patientId: targetPatientId },
      });
      const allocations = await tx.paymentAllocation.updateMany({
        where: { patientId: sourcePatientId },
        data: { patientId: targetPatientId },
      });

      // Move insurances that do not collide on type
      const sourceIns = await tx.patientInsurance.findMany({ where: { patientId: sourcePatientId } });
      const targetIns = await tx.patientInsurance.findMany({ where: { patientId: targetPatientId } });
      const targetTypes = new Set(targetIns.map((i) => i.insuranceType));
      let insuranceMoved = 0;
      for (const row of sourceIns) {
        if (targetTypes.has(row.insuranceType)) {
          await tx.patientInsurance.delete({ where: { id: row.id } });
        } else {
          await tx.patientInsurance.update({
            where: { id: row.id },
            data: { patientId: targetPatientId },
          });
          insuranceMoved += 1;
        }
      }

      await tx.patient.update({
        where: { id: sourcePatientId },
        data: {
          deletedAt: new Date(),
          deletedBy: user?.id || null,
          mergedIntoId: targetPatientId,
          chartStatus: 'inactive',
          registrationStatus: 'merged',
          updatedBy: user?.id || null,
        },
      });

      const details = {
        appointments: appointments.count,
        waitlist: waitlist.count,
        ledger: ledger.count,
        payments: payments.count,
        documents: documents.count,
        consents: consents.count,
        eligibility: eligibility.count,
        statements: statements.count,
        claims: claims.count,
        authorizations: auths.count,
        referrals: referrals.count,
        allocations: allocations.count,
        insuranceMoved,
        notes: notes || null,
      };

      await tx.patientMergeLog.create({
        data: {
          sourcePatientId,
          targetPatientId,
          summary: `Merged ${source.mrn} into ${target.mrn}`,
          details,
          mergedBy: user?.id || null,
        },
      });

      return details;
    });

    const patientLedgerService = require('./patientLedger.service');
    await patientLedgerService.syncAccountBalance(targetPatientId);

    return {
      sourcePatientId,
      targetPatientId,
      counts,
    };
  },
};

module.exports = patientMergeService;
