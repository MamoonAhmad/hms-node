const prisma = require('../lib/prisma');

function buildEncounterFilter(patientId, appointmentId) {
  const filter = { patientId };
  if (appointmentId) filter.appointmentId = appointmentId;
  return filter;
}

function userMeta(user) {
  return {
    createdBy: user?.id || null,
    createdByName: user?.name || user?.email || null,
  };
}

const intakeService = {
  async getSections(patientId, appointmentId, sectionKey) {
    const where = {
      ...buildEncounterFilter(patientId, appointmentId),
    };
    if (sectionKey) where.sectionKey = sectionKey;

    return prisma.patientIntakeSection.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
  },

  async saveSection(patientId, appointmentId, sectionKey, data, user, { isAddendum = false, parentId = null } = {}) {
    return prisma.patientIntakeSection.create({
      data: {
        patientId,
        appointmentId: appointmentId || null,
        sectionKey,
        data,
        isAddendum,
        parentId,
        ...userMeta(user),
      },
    });
  },

  async getScreenings(patientId, appointmentId, screeningType) {
    const where = buildEncounterFilter(patientId, appointmentId);
    if (screeningType) where.screeningType = screeningType;

    return prisma.patientScreeningScore.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  },

  async saveScreening(patientId, appointmentId, payload, user) {
    return prisma.patientScreeningScore.create({
      data: {
        patientId,
        appointmentId: appointmentId || null,
        screeningType: payload.screeningType,
        score: payload.score ?? null,
        maxScore: payload.maxScore ?? null,
        answers: payload.answers || {},
        notes: payload.notes || null,
        ...userMeta(user),
      },
    });
  },

  async getCompletion(patientId, appointmentId) {
    return prisma.patientIntakeCompletion.findFirst({
      where: buildEncounterFilter(patientId, appointmentId),
      orderBy: { updatedAt: 'desc' },
    });
  },

  async completeIntake(patientId, appointmentId, payload, user) {
    const existing = await this.getCompletion(patientId, appointmentId);
    const signedAt = new Date();
    const data = {
      completed: true,
      certificationAccepted: !!payload.certificationAccepted,
      intakeNotes: payload.intakeNotes || null,
      signedById: user?.id || null,
      signedByName: user?.name || user?.email || null,
      signedAt,
    };

    let completion;
    if (existing) {
      completion = await prisma.patientIntakeCompletion.update({
        where: { id: existing.id },
        data,
      });
    } else {
      completion = await prisma.patientIntakeCompletion.create({
        data: {
          patientId,
          appointmentId: appointmentId || null,
          ...data,
        },
      });
    }

    if (appointmentId) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'With Provider' },
      });
    }

    await this.saveSection(
      patientId,
      appointmentId,
      'intake_signature',
      {
        certificationText:
          'I certify that the intake information entered is accurate, complete to the best of my knowledge, and ready for provider review.',
        intakeNotes: payload.intakeNotes || null,
        signedByName: data.signedByName,
        signedAt: signedAt.toISOString(),
      },
      user,
    );

    return completion;
  },
};

module.exports = intakeService;
