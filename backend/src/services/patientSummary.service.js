const prisma = require('../lib/prisma');
const { pickActiveAppointment } = require('../utils/patientSummaryUtils');

const COMPLETED_STATUSES = ['Completed', 'Check out'];
const SCHEDULED_STATUSES = ['Scheduled', 'Rescheduled'];

const appointmentInclude = {
  appointmentTypeRef: { select: { name: true } },
  departmentRef: { select: { departmentName: true, facilityName: true } },
  providerRef: {
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      specialty: { select: { name: true } },
    },
  },
};

function formatProviderName(provider, fallback) {
  if (provider) {
    return [provider.firstName, provider.middleName, provider.lastName].filter(Boolean).join(' ');
  }
  return fallback || null;
}

function resolveLocation(appointment) {
  return (
    appointment.departmentRef?.facilityName ||
    appointment.departmentRef?.departmentName ||
    appointment.department ||
    null
  );
}

function serializeVisit(appointment) {
  if (!appointment) return null;
  return {
    encounterId: appointment.id,
    encounterNumber: appointment.encounterNumber,
    encounterDate: appointment.appointmentDate,
    appointmentDate: appointment.appointmentDate,
    appointmentTime: appointment.appointmentTime,
    visitType: appointment.appointmentTypeRef?.name || null,
    providerName: formatProviderName(appointment.providerRef, appointment.provider),
    location: resolveLocation(appointment),
    status: appointment.status,
  };
}

function deriveDefaultEligibility(patient) {
  if (patient.billingType === 'self_pay') return 'Not Available';
  if (patient.insurances?.length || patient.insuranceProviderId) return 'Pending';
  return 'Not Available';
}

const patientSummaryService = {
  async getSummary(patientId, { encounterId, mrn } = {}) {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, deletedAt: null },
      select: {
        id: true,
        mrn: true,
        billingType: true,
        insuranceProviderId: true,
        noKnownDrugAllergies: true,
        insuranceProvider: { select: { name: true } },
        insurances: {
          select: {
            memberId: true,
            insuranceProvider: { select: { name: true } },
          },
        },
      },
    });

    if (!patient) {
      const err = new Error('Patient not found');
      err.statusCode = 404;
      throw err;
    }

    if (mrn && patient.mrn !== mrn) {
      const err = new Error('Patient MRN does not match');
      err.statusCode = 400;
      throw err;
    }

    const appointments = await prisma.appointment.findMany({
      where: { patientId: patient.id },
      orderBy: [{ appointmentDate: 'desc' }, { appointmentTime: 'desc' }],
      include: appointmentInclude,
    });

    let currentEncounter = null;
    if (encounterId) {
      currentEncounter = appointments.find((a) => a.id === encounterId) || null;
    }
    if (!currentEncounter) {
      const mapped = appointments.map((a) => ({
        ...a,
        appointmentType: a.appointmentTypeRef?.name,
      }));
      const picked = pickActiveAppointment(mapped);
      currentEncounter = picked
        ? appointments.find((a) => a.id === picked.id) || appointments[0]
        : appointments[0] || null;
    }

    const currentDate = currentEncounter?.appointmentDate || new Date();
    const todayMs = new Date().setHours(0, 0, 0, 0);

    const lastVisit =
      appointments
        .filter((appt) => {
          if (currentEncounter && appt.id === currentEncounter.id) return false;
          if (!COMPLETED_STATUSES.includes(appt.status)) return false;
          if (!currentEncounter) return true;
          const apptMs = new Date(appt.appointmentDate).getTime();
          const currentMs = new Date(currentEncounter.appointmentDate).getTime();
          if (apptMs < currentMs) return true;
          if (
            apptMs === currentMs &&
            (appt.appointmentTime || '') < (currentEncounter.appointmentTime || '')
          ) {
            return true;
          }
          return false;
        })
        .sort((a, b) => {
          const dateDiff = new Date(b.appointmentDate) - new Date(a.appointmentDate);
          if (dateDiff !== 0) return dateDiff;
          return (b.appointmentTime || '').localeCompare(a.appointmentTime || '');
        })[0] || null;

    const upcomingVisit = [...appointments]
      .filter((appt) => {
        const apptMs = new Date(appt.appointmentDate).setHours(0, 0, 0, 0);
        if (apptMs <= todayMs) return false;
        return SCHEDULED_STATUSES.includes(appt.status);
      })
      .sort((a, b) => {
        const dateDiff = new Date(a.appointmentDate) - new Date(b.appointmentDate);
        if (dateDiff !== 0) return dateDiff;
        return (a.appointmentTime || '').localeCompare(b.appointmentTime || '');
      })[0] || null;

    const chiefComplaint =
      currentEncounter?.chiefComplaint ||
      currentEncounter?.visitReason ||
      null;

    const provider = currentEncounter
      ? {
          name: formatProviderName(currentEncounter.providerRef, currentEncounter.provider),
          specialty: currentEncounter.providerRef?.specialty?.name || null,
        }
      : null;

    const [problems, allergies, eligibilityRows, orders] = await Promise.all([
      prisma.patientProblem.findMany({
        where: { patientId: patient.id, isDeleted: false },
        orderBy: [{ status: 'asc' }, { onsetDate: 'desc' }],
      }),
      prisma.patientAllergy.findMany({
        where: { patientId: patient.id },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.insuranceEligibility.findMany({
        where: { patientId: patient.id },
        orderBy: { verifiedAt: 'desc' },
        take: 1,
      }),
      currentEncounter
        ? prisma.order.findMany({
            where: {
              patientId: patient.id,
              appointmentId: currentEncounter.id,
            },
            orderBy: { orderDateTime: 'desc' },
          })
        : prisma.order.findMany({
            where: { patientId: patient.id },
            orderBy: { orderDateTime: 'desc' },
            take: 20,
          }),
    ]);

    const latestEligibility = eligibilityRows[0];
    const insuranceEligibilityStatus =
      latestEligibility?.status || deriveDefaultEligibility(patient);

    return {
      patientId: patient.id,
      mrn: patient.mrn,
      currentEncounterId: currentEncounter?.id || null,
      chiefComplaint,
      lastVisit: serializeVisit(lastVisit),
      upcomingVisit: serializeVisit(upcomingVisit),
      provider,
      insuranceEligibilityStatus,
      problems: problems.map((p) => ({
        id: p.id,
        problemCode: p.problemCode,
        description: p.description,
        status: p.status,
        clinicalStatus: p.clinicalStatus,
        verification: p.verification,
        onsetDate: p.onsetDate,
        resolvedDate: p.resolvedDate,
      })),
      allergies: {
        nkda: patient.noKnownDrugAllergies,
        items: allergies.map((a) => ({
          id: a.id,
          allergenName: a.allergenName,
          reaction: a.reaction,
          severity: a.severity,
          onsetDate: a.onsetDate,
          status: a.status,
          comment: a.comment,
        })),
      },
      orders: orders.map((o) => ({
        id: o.id,
        orderName: o.procedureName,
        orderType: o.category,
        orderStatus: o.status,
        orderedBy: o.orderedBy,
        orderedDate: o.orderDateTime,
        priority: o.priority || 'Routine',
      })),
    };
  },
};

module.exports = patientSummaryService;
