const prisma = require('../lib/prisma');

function httpError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function splitName(fullName) {
  const parts = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return { firstName: 'Unknown', lastName: 'Guarantor' };
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

const patientGuarantorService = {
  async getForPatient(patientId) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { guarantorAccount: true },
    });
    if (!patient || patient.deletedAt) throw httpError('Patient not found', 404);
    return {
      guarantor: patient.guarantorAccount,
      legacy: {
        guarantorName: patient.guarantorName,
        guarantorPhone: patient.guarantorPhone,
        guarantorRelationship: patient.guarantorRelationship,
        guarantorEmail: patient.guarantorEmail,
        guarantorAddress: patient.guarantorAddress,
        guarantorCity: patient.guarantorCity,
        guarantorState: patient.guarantorState,
        guarantorZip: patient.guarantorZip,
        guarantorDateOfBirth: patient.guarantorDateOfBirth,
      },
    };
  },

  async upsertForPatient(patientId, body, user) {
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient || patient.deletedAt) throw httpError('Patient not found', 404);

    let firstName = body.firstName;
    let lastName = body.lastName;
    if ((!firstName || !lastName) && body.guarantorName) {
      const split = splitName(body.guarantorName);
      firstName = firstName || split.firstName;
      lastName = lastName || split.lastName;
    }
    if (!firstName || !lastName) throw httpError('Guarantor first and last name are required');

    const payload = {
      firstName,
      lastName,
      middleName: body.middleName || null,
      relationship: body.relationship || body.guarantorRelationship || 'self',
      dateOfBirth: body.dateOfBirth || body.guarantorDateOfBirth
        ? new Date(body.dateOfBirth || body.guarantorDateOfBirth)
        : null,
      phone: body.phone || body.guarantorPhone || null,
      email: body.email || body.guarantorEmail || null,
      address: body.address || body.guarantorAddress || null,
      addressLine2: body.addressLine2 || null,
      city: body.city || body.guarantorCity || null,
      state: body.state || body.guarantorState || null,
      zip: body.zip || body.guarantorZip || null,
      ssnLast4: body.ssnLast4 || null,
      employerName: body.employerName || null,
      notes: body.notes || null,
      isActive: body.isActive !== false,
      updatedBy: user?.id || null,
    };

    let guarantor;
    if (patient.guarantorId) {
      guarantor = await prisma.guarantor.update({
        where: { id: patient.guarantorId },
        data: payload,
      });
    } else {
      guarantor = await prisma.guarantor.create({
        data: { ...payload, createdBy: user?.id || null },
      });
    }

    await prisma.patient.update({
      where: { id: patientId },
      data: {
        guarantorId: guarantor.id,
        guarantorName: `${guarantor.firstName} ${guarantor.lastName}`.trim(),
        guarantorPhone: guarantor.phone,
        guarantorRelationship: guarantor.relationship,
        guarantorEmail: guarantor.email,
        guarantorAddress: guarantor.address,
        guarantorCity: guarantor.city,
        guarantorState: guarantor.state,
        guarantorZip: guarantor.zip,
        guarantorDateOfBirth: guarantor.dateOfBirth,
        updatedBy: user?.id || null,
      },
    });

    return guarantor;
  },
};

module.exports = patientGuarantorService;
