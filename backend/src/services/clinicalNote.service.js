const prisma = require('../lib/prisma');
const notesChartContextService = require('./notesChartContext.service');

const NOTE_TYPES = ['soap', 'progress', 'telephonic', 'blank', 'nurse'];

const ADDENDUM_SECTIONS = {
  soap: ['subjective', 'objective', 'assessment', 'plan'],
  progress: ['clinicalSummary', 'assessment', 'plan'],
  telephonic: ['callReason', 'discussion', 'followUp'],
  nurse: ['nursingAssessment', 'interventions', 'education'],
  blank: ['content'],
};

function userMeta(user) {
  return {
    createdBy: user?.id || null,
    createdByName: user?.name || user?.email || null,
    updatedBy: user?.id || null,
    updatedByName: user?.name || user?.email || null,
  };
}

function noteTypeLabel(type) {
  const labels = {
    soap: 'SOAP Note',
    progress: 'Progress Note',
    telephonic: 'Telephonic Note',
    blank: 'Blank Note',
    nurse: 'Nurse Note',
  };
  return labels[type] || type;
}

function defaultContent(noteType, autoPopulate = {}) {
  switch (noteType) {
    case 'soap':
      return {
        header: '',
        subjective: {
          intakeChiefComplaint: autoPopulate.chiefComplaint || 'No data available.',
          intakeHpi: autoPopulate.hpi || 'No data available.',
          intakeRos: autoPopulate.ros || 'No data available.',
          intakeAllergies: autoPopulate.allergies || 'No data available.',
          intakeMeds: autoPopulate.medications || 'No data available.',
          providerNotes: '',
        },
        objective: {
          intakeVitals: autoPopulate.vitalsText || 'No data available.',
          physicalFindings: '',
          labs: 'No data available.',
          imaging: 'No data available.',
          providerNotes: '',
        },
        assessment: {
          intakeProblems: autoPopulate.pastMedicalHistory || 'No data available.',
          providerNotes: '',
        },
        plan: { providerNotes: '' },
      };
    case 'progress':
      return {
        header: '',
        clinicalSummary: { providerNotes: autoPopulate.hpi || 'No data available.' },
        assessment: { providerNotes: '' },
        plan: { providerNotes: '' },
      };
    case 'telephonic':
      return {
        callerInformation: '',
        callReason: { providerNotes: '' },
        discussion: { providerNotes: '' },
        recommendations: '',
        followUp: { providerNotes: '' },
      };
    case 'nurse':
      return {
        nursingAssessment: { providerNotes: autoPopulate.vitalsText || 'No data available.' },
        interventions: { providerNotes: '' },
        observations: { providerNotes: autoPopulate.vitalsText || 'No data available.' },
        patientEducation: { providerNotes: '' },
        followUp: { providerNotes: '' },
      };
    case 'blank':
    default:
      return { title: '', content: '' };
  }
}

function serializeNote(note) {
  return {
    id: note.id,
    patientId: note.patientId,
    appointmentId: note.appointmentId,
    noteType: note.noteType,
    title: note.title,
    status: note.status,
    content: note.content,
    diagnoses: note.diagnoses || [],
    attachments: note.attachments || [],
    providerId: note.providerId,
    providerName: note.providerName,
    location: note.location,
    signedById: note.signedById,
    signedByName: note.signedByName,
    signedAt: note.signedAt?.toISOString?.() || note.signedAt || null,
    createdBy: note.createdBy,
    createdByName: note.createdByName,
    createdAt: note.createdAt?.toISOString?.() || note.createdAt,
    updatedBy: note.updatedBy,
    updatedByName: note.updatedByName,
    updatedAt: note.updatedAt?.toISOString?.() || note.updatedAt,
    addendums: (note.addendums || []).map((a) => ({
      id: a.id,
      sections: a.sections,
      content: a.content,
      diagnoses: a.diagnoses || [],
      attachments: a.attachments || [],
      signedByName: a.signedByName,
      signedAt: a.signedAt?.toISOString?.() || a.signedAt || null,
      createdByName: a.createdByName,
      createdAt: a.createdAt?.toISOString?.() || a.createdAt,
    })),
  };
}

const clinicalNoteService = {
  async getChartContext(patientId, query) {
    return notesChartContextService.getChartContext(patientId, query);
  },

  async findAll(patientId, { appointmentId, allEncounters = false } = {}) {
    const where = { patientId, isDeleted: false };
    if (!allEncounters && appointmentId) where.appointmentId = appointmentId;

    const notes = await prisma.patientClinicalNote.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        addendums: { orderBy: { createdAt: 'asc' } },
      },
    });

    const appointments = await prisma.appointment.findMany({
      where: { patientId },
      select: {
        id: true,
        appointmentDate: true,
        encounterNumber: true,
      },
    });
    const apptMap = Object.fromEntries(appointments.map((a) => [a.id, a]));

    return notes.map((n) => ({
      ...serializeNote(n),
      encounterDate: apptMap[n.appointmentId]?.appointmentDate || null,
      encounterNumber: apptMap[n.appointmentId]?.encounterNumber || null,
      noteTitle: n.title || noteTypeLabel(n.noteType),
    }));
  },

  async findById(patientId, noteId) {
    const note = await prisma.patientClinicalNote.findFirst({
      where: { id: noteId, patientId, isDeleted: false },
      include: { addendums: { orderBy: { createdAt: 'asc' } } },
    });
    if (!note) {
      const err = new Error('Note not found');
      err.statusCode = 404;
      throw err;
    }
    return serializeNote(note);
  },

  async create(patientId, payload, user) {
    if (!NOTE_TYPES.includes(payload.noteType)) {
      const err = new Error('Invalid note type');
      err.statusCode = 400;
      throw err;
    }

    const ctx = await notesChartContextService.getChartContext(patientId, {
      appointmentId: payload.appointmentId,
    });

    const content = payload.content || defaultContent(payload.noteType, ctx.autoPopulate);

    const note = await prisma.patientClinicalNote.create({
      data: {
        patientId,
        appointmentId: payload.appointmentId || null,
        noteType: payload.noteType,
        title: payload.title || noteTypeLabel(payload.noteType),
        status: 'Draft',
        content,
        diagnoses: payload.diagnoses || [],
        attachments: payload.attachments || [],
        providerId: payload.providerId || null,
        providerName: payload.providerName || ctx.encounter?.provider || userMeta(user).createdByName,
        location: payload.location || ctx.encounter?.location || null,
        ...userMeta(user),
      },
      include: { addendums: true },
    });

    return serializeNote(note);
  },

  async update(patientId, noteId, payload, user) {
    const existing = await prisma.patientClinicalNote.findFirst({
      where: { id: noteId, patientId, isDeleted: false },
    });
    if (!existing) {
      const err = new Error('Note not found');
      err.statusCode = 404;
      throw err;
    }
    if (existing.status === 'Signed') {
      const err = new Error('Signed notes cannot be edited');
      err.statusCode = 400;
      throw err;
    }

    const data = {
      updatedBy: user?.id || null,
      updatedByName: user?.name || user?.email || null,
    };
    if (payload.title !== undefined) data.title = payload.title;
    if (payload.content !== undefined) data.content = payload.content;
    if (payload.diagnoses !== undefined) data.diagnoses = payload.diagnoses;
    if (payload.attachments !== undefined) data.attachments = payload.attachments;

    const note = await prisma.patientClinicalNote.update({
      where: { id: noteId },
      data,
      include: { addendums: { orderBy: { createdAt: 'asc' } } },
    });
    return serializeNote(note);
  },

  async sign(patientId, noteId, user) {
    const existing = await prisma.patientClinicalNote.findFirst({
      where: { id: noteId, patientId, isDeleted: false },
    });
    if (!existing) {
      const err = new Error('Note not found');
      err.statusCode = 404;
      throw err;
    }
    if (existing.status === 'Signed') {
      const err = new Error('Note is already signed');
      err.statusCode = 400;
      throw err;
    }

    const note = await prisma.patientClinicalNote.update({
      where: { id: noteId },
      data: {
        status: 'Signed',
        signedById: user?.id || null,
        signedByName: user?.name || user?.email || null,
        signedAt: new Date(),
        updatedBy: user?.id || null,
        updatedByName: user?.name || user?.email || null,
      },
      include: { addendums: { orderBy: { createdAt: 'asc' } } },
    });
    return serializeNote(note);
  },

  async addAddendum(patientId, noteId, payload, user) {
    const existing = await prisma.patientClinicalNote.findFirst({
      where: { id: noteId, patientId, isDeleted: false },
      include: { addendums: true },
    });
    if (!existing) {
      const err = new Error('Note not found');
      err.statusCode = 404;
      throw err;
    }
    if (existing.status !== 'Signed') {
      const err = new Error('Addendum can only be added to signed notes');
      err.statusCode = 400;
      throw err;
    }

    const addendum = await prisma.patientClinicalNoteAddendum.create({
      data: {
        noteId,
        sections: payload.sections || [],
        content: payload.content || {},
        diagnoses: payload.diagnoses || [],
        attachments: payload.attachments || [],
        signedById: user?.id || null,
        signedByName: user?.name || user?.email || null,
        signedAt: new Date(),
        createdBy: user?.id || null,
        createdByName: user?.name || user?.email || null,
      },
    });

    await prisma.patientClinicalNote.update({
      where: { id: noteId },
      data: {
        updatedBy: user?.id || null,
        updatedByName: user?.name || user?.email || null,
      },
    });

    return addendum;
  },

  async remove(patientId, noteId, user) {
    const existing = await prisma.patientClinicalNote.findFirst({
      where: { id: noteId, patientId, isDeleted: false },
    });
    if (!existing) {
      const err = new Error('Note not found');
      err.statusCode = 404;
      throw err;
    }
    if (existing.status === 'Signed') {
      const err = new Error('Signed notes cannot be deleted');
      err.statusCode = 400;
      throw err;
    }

    await prisma.patientClinicalNote.update({
      where: { id: noteId },
      data: {
        isDeleted: true,
        updatedBy: user?.id || null,
        updatedByName: user?.name || user?.email || null,
      },
    });
    return { success: true };
  },

  getAddendumSections(noteType) {
    return ADDENDUM_SECTIONS[noteType] || [];
  },

  NOTE_TYPES,
};

module.exports = clinicalNoteService;
