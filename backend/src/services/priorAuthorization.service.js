const prisma = require('../lib/prisma');

function httpError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

const priorAuthorizationService = {
  async create(appointmentId, body, user) {
    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment) throw httpError('Appointment not found', 404);

    const auth = await prisma.priorAuthorization.create({
      data: {
        patientId: appointment.patientId,
        appointmentId,
        insuranceProviderId: body.insuranceProviderId || null,
        authorizationNumber: body.authorizationNumber || null,
        status: body.status || 'Pending',
        payerName: body.payerName || null,
        providerId: body.providerId || appointment.providerId || null,
        serviceCode: body.serviceCode || null,
        serviceDescription: body.serviceDescription || null,
        approvedUnits: body.approvedUnits != null ? parseInt(body.approvedUnits, 10) : null,
        usedUnits: body.usedUnits != null ? parseInt(body.usedUnits, 10) : 0,
        remainingUnits:
          body.remainingUnits != null
            ? parseInt(body.remainingUnits, 10)
            : body.approvedUnits != null
              ? parseInt(body.approvedUnits, 10)
              : null,
        effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : null,
        expirationDate: body.expirationDate ? new Date(body.expirationDate) : null,
        notes: body.notes || null,
        createdBy: user?.id || null,
        updatedBy: user?.id || null,
      },
    });

    const rcmStatus =
      auth.status === 'Approved'
        ? 'Authorization Approved'
        : auth.status === 'Denied'
          ? 'Authorization Pending'
          : 'Authorization Pending';

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        priorAuthorizationId: auth.id,
        rcmStatus,
        updatedBy: user?.id || null,
      },
    });

    return auth;
  },

  async listForAppointment(appointmentId) {
    return prisma.priorAuthorization.findMany({
      where: { appointmentId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async update(id, body, user) {
    const existing = await prisma.priorAuthorization.findUnique({ where: { id } });
    if (!existing) throw httpError('Authorization not found', 404);
    const auth = await prisma.priorAuthorization.update({
      where: { id },
      data: {
        ...body,
        effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : undefined,
        expirationDate: body.expirationDate ? new Date(body.expirationDate) : undefined,
        updatedBy: user?.id || null,
      },
    });
    if (existing.appointmentId && body.status) {
      await prisma.appointment.update({
        where: { id: existing.appointmentId },
        data: {
          rcmStatus:
            body.status === 'Approved' ? 'Authorization Approved' : 'Authorization Pending',
        },
      });
    }
    return auth;
  },
};

module.exports = priorAuthorizationService;
