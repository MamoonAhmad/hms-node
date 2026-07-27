const prisma = require('../lib/prisma');
const { randomBytes } = require('crypto');

const CHECKOUT_STATUSES = [
  'not_started',
  'in_progress',
  'pending_clinical_sign_off',
  'pending_payment',
  'pending_follow_up',
  'completed',
  'cancelled',
];

const CHECKLIST_ITEMS = [
  'provider_note_signed',
  'diagnosis_added',
  'orders_reviewed',
  'labs_imaging_reviewed',
  'medications_reviewed',
  'referrals_reviewed',
  'follow_up_scheduled',
  'patient_instructions_provided',
  'documents_printed_or_shared',
  'copay_payment_collected',
  'billing_codes_reviewed',
  'insurance_verified',
  'checkout_completed',
];

const CHECKLIST_STATES = ['completed', 'pending', 'not_required', 'needs_attention'];

const LAB_IMAGING_CATEGORIES = ['Laboratory', 'Lab', 'Imaging', 'Radiology', 'X-Ray', 'MRI', 'CT'];

const MEDICATION_HANDLED_STATUSES = ['Signed', 'Sent', 'Printed', 'Administered', 'Completed', 'Active'];

function formatUserName(user) {
  if (!user) return null;
  const parts = [user.firstName, user.lastName].filter(Boolean);
  if (parts.length) return parts.join(' ');
  return user.name || user.email || null;
}

function calcAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

function generateReceiptNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(3).toString('hex').toUpperCase();
  return `RCP-${ts}-${rand}`;
}

async function assertPatientExists(patientId) {
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, deletedAt: null },
    select: { id: true },
  });
  if (!patient) {
    const err = new Error('Patient not found');
    err.statusCode = 404;
    throw err;
  }
}

async function assertAppointment(patientId, appointmentId) {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, patientId },
    include: {
      appointmentTypeRef: { select: { name: true } },
      providerRef: {
        select: { firstName: true, middleName: true, lastName: true, specialty: { select: { name: true } } },
      },
      departmentRef: { select: { departmentName: true, facilityName: true } },
    },
  });
  if (!appointment) {
    const err = new Error('Encounter not found for this patient');
    err.statusCode = 404;
    throw err;
  }
  return appointment;
}

async function logAudit(checkoutId, action, user, details = null) {
  return prisma.patientCheckoutAuditLog.create({
    data: {
      checkoutId,
      action,
      details,
      userId: user?.id || null,
      userName: formatUserName(user),
    },
  });
}

async function getOrCreateCheckout(patientId, appointmentId, user) {
  let checkout = await prisma.patientCheckout.findUnique({
    where: { appointmentId },
    include: {
      instructions: { orderBy: { createdAt: 'asc' } },
      notes: { orderBy: { createdAt: 'desc' } },
      tasks: { orderBy: { createdAt: 'desc' } },
      payments: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!checkout) {
    checkout = await prisma.patientCheckout.create({
      data: {
        patientId,
        appointmentId,
        status: 'not_started',
        createdBy: user?.id || null,
        updatedBy: user?.id || null,
      },
      include: {
        instructions: true,
        notes: true,
        tasks: true,
        payments: true,
      },
    });
    await logAudit(checkout.id, 'checkout_created', user);
  }

  return checkout;
}

function formatProviderName(appointment) {
  if (appointment?.providerRef) {
    const parts = [
      appointment.providerRef.firstName,
      appointment.providerRef.middleName,
      appointment.providerRef.lastName,
    ].filter(Boolean);
    if (parts.length) return parts.join(' ');
  }
  return appointment?.provider?.trim() || null;
}

function formatLocation(appointment) {
  return (
    appointment?.departmentRef?.facilityName ||
    appointment?.departmentRef?.departmentName ||
    appointment?.department ||
    null
  );
}

function isLabOrImaging(order) {
  const cat = (order.category || '').toLowerCase();
  return LAB_IMAGING_CATEGORIES.some((c) => cat.includes(c.toLowerCase()));
}

function computeChecklistItemState(key, ctx, overrides = {}) {
  if (overrides[key]) return overrides[key];

  const {
    intakeStatus,
    problems,
    orders,
    labImagingOrders,
    medications,
    referrals,
    checkout,
    eligibility,
    patient,
  } = ctx;

  switch (key) {
    case 'provider_note_signed':
      if (intakeStatus?.certifiedAt || intakeStatus?.status === 'certified') return 'completed';
      if (intakeStatus?.completedAt) return 'completed';
      return 'needs_attention';

    case 'diagnosis_added':
      if ((problems || []).length > 0) return 'completed';
      return 'needs_attention';

    case 'orders_reviewed': {
      if ((orders || []).length === 0) return 'not_required';
      const pending = orders.filter((o) => !['Signed', 'Sent', 'Completed', 'Cancelled'].includes(o.status));
      return pending.length === 0 ? 'completed' : 'needs_attention';
    }

    case 'labs_imaging_reviewed': {
      if ((labImagingOrders || []).length === 0) return 'not_required';
      const pending = labImagingOrders.filter(
        (o) => !['Signed', 'Sent', 'Completed', 'Cancelled'].includes(o.status),
      );
      return pending.length === 0 ? 'completed' : 'needs_attention';
    }

    case 'medications_reviewed': {
      if ((medications || []).length === 0) return 'not_required';
      const pending = medications.filter((m) => !MEDICATION_HANDLED_STATUSES.includes(m.status));
      return pending.length === 0 ? 'completed' : 'needs_attention';
    }

    case 'referrals_reviewed': {
      if ((referrals || []).length === 0) return 'not_required';
      const pending = referrals.filter((r) => !['Sent', 'Completed', 'Scheduled', 'Cancelled'].includes(r.status));
      return pending.length === 0 ? 'completed' : 'pending';
    }

    case 'follow_up_scheduled':
      if (checkout.followUpRequired === false) return 'not_required';
      if (checkout.followUpRequired === true) {
        const fu = checkout.followUpData || {};
        if (fu.appointmentDate || checkout.followUpReason?.trim()) return 'completed';
        return 'needs_attention';
      }
      return 'pending';

    case 'patient_instructions_provided':
      if ((checkout.instructions || []).length > 0) return 'completed';
      return 'pending';

    case 'documents_printed_or_shared': {
      const meta = checkout.documentsMeta || {};
      if (meta.printedOrShared) return 'completed';
      return 'pending';
    }

    case 'copay_payment_collected': {
      const copay = Number(patient?.copay || 0);
      if (copay <= 0 || patient?.billingType === 'Self-Pay') {
        const waived = (checkout.payments || []).some((p) => p.paymentMethod === 'Waived');
        if (waived || copay <= 0) return copay <= 0 ? 'not_required' : 'completed';
      }
      if ((checkout.payments || []).length > 0) return 'completed';
      if (copay > 0) return 'needs_attention';
      return 'not_required';
    }

    case 'billing_codes_reviewed': {
      const billing = checkout.billingData || {};
      if (billing.codesReviewed) return 'completed';
      return 'pending';
    }

    case 'insurance_verified': {
      if (patient?.billingType === 'Self-Pay' || checkout.insuranceStatus === 'Self-Pay') return 'not_required';
      if (checkout.insuranceStatus === 'Verified' || eligibility?.status === 'Verified') return 'completed';
      if (checkout.insuranceStatus === 'Inactive' || checkout.insuranceStatus === 'Not Verified') {
        return 'needs_attention';
      }
      return 'needs_attention';
    }

    case 'checkout_completed':
      return checkout.status === 'completed' ? 'completed' : 'pending';

    default:
      return 'pending';
  }
}

function computeChecklist(ctx) {
  const overrides = ctx.checkout.checklistOverrides || {};
  return CHECKLIST_ITEMS.map((key) => ({
    key,
    state: computeChecklistItemState(key, ctx, overrides),
  }));
}

function deriveCheckoutStatus(checklist, checkout) {
  if (checkout.status === 'completed') return 'completed';
  if (checkout.status === 'cancelled') return 'cancelled';

  const stateMap = Object.fromEntries(checklist.map((c) => [c.key, c.state]));

  if (stateMap.checkout_completed === 'completed') return 'completed';

  const hasNeedsAttention = checklist.some(
    (c) => c.state === 'needs_attention' && c.key !== 'checkout_completed',
  );
  if (hasNeedsAttention) {
    if (
      stateMap.provider_note_signed === 'needs_attention' ||
      stateMap.diagnosis_added === 'needs_attention'
    ) {
      return 'pending_clinical_sign_off';
    }
    if (stateMap.copay_payment_collected === 'needs_attention') return 'pending_payment';
    if (stateMap.follow_up_scheduled === 'needs_attention') return 'pending_follow_up';
    return 'in_progress';
  }

  const allDone = checklist
    .filter((c) => c.key !== 'checkout_completed')
    .every((c) => c.state === 'completed' || c.state === 'not_required');

  if (allDone) return 'in_progress';

  if (checkout.status === 'not_started') return 'not_started';
  return 'in_progress';
}

function buildClinicalReview(ctx) {
  const warnings = [];
  const checklist = computeChecklist(ctx);
  const stateMap = Object.fromEntries(checklist.map((c) => [c.key, c.state]));

  if (stateMap.provider_note_signed === 'needs_attention') {
    warnings.push('Provider note is not signed. Checkout cannot be completed until the note is signed.');
  }
  if (stateMap.diagnosis_added === 'needs_attention') {
    warnings.push('No diagnosis documented for this visit.');
  }
  if (stateMap.medications_reviewed === 'needs_attention') {
    warnings.push('One or more medication orders are not signed, sent, or printed.');
  }
  if (stateMap.referrals_reviewed === 'needs_attention' || stateMap.referrals_reviewed === 'pending') {
    const pendingRefs = (ctx.referrals || []).filter(
      (r) => !['Sent', 'Completed', 'Scheduled', 'Cancelled'].includes(r.status),
    );
    if (pendingRefs.length) {
      warnings.push(`${pendingRefs.length} referral(s) require review before checkout.`);
    }
  }

  const chiefComplaintRecord = (ctx.intakeRecords || []).find(
    (r) => r.sectionType === 'chief_complaint_hpi' && !r.isAddendum,
  );
  const chiefComplaint =
    chiefComplaintRecord?.payload?.chiefComplaint ||
    ctx.appointment?.visitReason ||
    null;

  return {
    chiefComplaint,
    diagnoses: (ctx.problems || []).map((p) => ({
      code: p.icd10Code,
      description: p.diagnosisDescription,
      status: p.status,
    })),
    assessment: chiefComplaintRecord?.payload?.assessment || null,
    plan: chiefComplaintRecord?.payload?.plan || null,
    signedSoapNote: stateMap.provider_note_signed === 'completed',
    ordersCount: (ctx.orders || []).length,
    medicationsCount: (ctx.medications || []).length,
    proceduresCount: (ctx.orders || []).filter((o) =>
      (o.category || '').toLowerCase().includes('procedure'),
    ).length,
    referralsCount: (ctx.referrals || []).length,
    patientInstructions: (ctx.checkout.instructions || []).map((i) => ({
      type: i.instructionType,
      content: i.content,
    })),
    followUpPlan: ctx.checkout.followUpReason || null,
    warnings,
  };
}

function buildBillingSnapshot(patient, insurances, checkout) {
  const primary = insurances.find((i) => i.insuranceType === 'Primary') || insurances[0];
  const secondary = insurances.find((i) => i.insuranceType === 'Secondary');
  const billingData = checkout.billingData || {};

  return {
    insuranceStatus: checkout.insuranceStatus || 'Pending',
    primaryInsurance: primary
      ? {
          provider: primary.insuranceProvider?.name || '—',
          memberId: primary.memberId,
          copay: primary.copay,
        }
      : null,
    secondaryInsurance: secondary
      ? {
          provider: secondary.insuranceProvider?.name || '—',
          memberId: secondary.memberId,
        }
      : null,
    copayAmount: Number(patient?.copay || primary?.copay || 0),
    balanceDue: billingData.balanceDue ?? Number(patient?.copay || 0),
    charges: billingData.charges || [],
    cptCodes: billingData.cptCodes || [],
    icd10Codes: billingData.icd10Codes || [],
    billingProvider: billingData.billingProvider || null,
    paymentStatus:
      (checkout.payments || []).length > 0
        ? 'Collected'
        : Number(patient?.copay || 0) > 0
          ? 'Due'
          : 'Not Required',
  };
}

async function getCheckoutBundle(patientId, appointmentId, user) {
  await assertPatientExists(patientId);
  const appointment = await assertAppointment(patientId, appointmentId);

  let checkout = await getOrCreateCheckout(patientId, appointmentId, user);

  const [
    patient,
    orders,
    medications,
    referrals,
    problems,
    intakeStatus,
    intakeRecords,
    insurances,
    eligibility,
  ] = await Promise.all([
    prisma.patient.findFirst({
      where: { id: patientId, deletedAt: null },
      select: {
        id: true,
        mrn: true,
        firstName: true,
        middleName: true,
        lastName: true,
        dateOfBirth: true,
        gender: true,
        cellPhone: true,
        email: true,
        profilePhoto: true,
        billingType: true,
        copay: true,
        deductible: true,
        paymentMethod: true,
      },
    }),
    prisma.order.findMany({
      where: { patientId, appointmentId },
      orderBy: { orderDateTime: 'desc' },
    }),
    prisma.medicationOrder.findMany({
      where: { patientId, appointmentId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.patientReferral.findMany({
      where: { patientId, appointmentId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.patientProblem.findMany({
      where: { patientId, deletedAt: null },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.patientIntakeStatus.findFirst({
      where: { patientId, appointmentId },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.patientIntakeRecord.findMany({
      where: { patientId, appointmentId, isDeleted: false, isAddendum: false },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.patientInsurance.findMany({
      where: { patientId },
      include: { insuranceProvider: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.insuranceEligibilityVerification.findFirst({
      where: { patientId },
      orderBy: { verifiedAt: 'desc' },
    }),
  ]);

  const labImagingOrders = orders.filter(isLabOrImaging);

  const ctx = {
    checkout,
    intakeStatus,
    intakeRecords,
    problems,
    orders,
    labImagingOrders,
    medications,
    referrals,
    eligibility,
    patient,
    appointment,
  };

  const checklist = computeChecklist(ctx);
  const derivedStatus = deriveCheckoutStatus(checklist, checkout);

  if (derivedStatus !== checkout.status && checkout.status !== 'completed' && checkout.status !== 'cancelled') {
    checkout = await prisma.patientCheckout.update({
      where: { id: checkout.id },
      data: { status: derivedStatus, updatedBy: user?.id || null },
      include: {
        instructions: { orderBy: { createdAt: 'asc' } },
        notes: { orderBy: { createdAt: 'desc' } },
        tasks: { orderBy: { createdAt: 'desc' } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });
    ctx.checkout = checkout;
  }

  const patientName = [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ');
  const apptDate =
    appointment.appointmentDate instanceof Date
      ? appointment.appointmentDate.toISOString().slice(0, 10)
      : String(appointment.appointmentDate).slice(0, 10);

  const billing = buildBillingSnapshot(patient, insurances, checkout);
  billing.icd10Codes =
    checkout.billingData?.icd10Codes ||
    problems.map((p) => p.icd10Code).filter(Boolean);

  return {
    checkout,
    status: checkout.status,
    checklist,
    header: {
      patient: {
        name: patientName,
        mrn: patient.mrn,
        dateOfBirth: patient.dateOfBirth,
        age: calcAge(patient.dateOfBirth),
        gender: patient.gender,
        phone: patient.cellPhone,
        email: patient.email,
        photoUrl: patient.profilePhoto,
      },
      encounter: {
        encounterNumber: appointment.encounterNumber,
        visitDate: apptDate,
        visitType: appointment.appointmentTypeRef?.name || 'Visit',
        appointmentTime: appointment.appointmentTime,
        provider: formatProviderName(appointment),
        department: appointment.departmentRef?.departmentName || appointment.department,
        location: formatLocation(appointment),
        room: null,
        visitStatus: appointment.status,
      },
    },
    clinicalReview: buildClinicalReview(ctx),
    orders: orders.map((o) => ({
      id: o.id,
      orderType: o.category,
      procedureName: o.procedureName,
      procedureCode: o.procedureCode,
      status: o.status,
      orderedBy: o.orderedBy,
      orderDateTime: o.orderDateTime,
    })),
    medications: medications.map((m) => ({
      id: m.id,
      medicationName: m.medicationName,
      dose: m.dose,
      route: m.route,
      frequency: m.frequency,
      duration: m.duration,
      handlingMethod: m.handlingMethod,
      pharmacy: m.pharmacy,
      status: m.status,
      instructions: m.additionalInstructions || m.sigPreview,
    })),
    referrals: referrals.map((r) => ({
      id: r.id,
      referralNumber: r.referralNumber,
      referralType: r.referralType,
      specialty: r.specialty,
      referredTo: r.referredToName || r.referredToOrganization,
      priority: r.priority,
      authorizationStatus: r.authorizationStatus,
      appointmentStatus: r.appointmentScheduledDate ? 'Scheduled' : 'Not Scheduled',
      status: r.status,
    })),
    billing,
    insurance: {
      status: checkout.insuranceStatus || eligibility?.status || (patient.billingType === 'Self-Pay' ? 'Self-Pay' : 'Pending'),
      eligibility,
      insurances,
    },
    validation: buildValidation(checklist, ctx),
  };
}

function buildValidation(checklist, ctx) {
  const blockers = [];
  const stateMap = Object.fromEntries(checklist.map((c) => [c.key, c.state]));

  const requiredChecks = [
    'provider_note_signed',
    'diagnosis_added',
    'orders_reviewed',
    'medications_reviewed',
    'follow_up_scheduled',
    'patient_instructions_provided',
    'copay_payment_collected',
    'insurance_verified',
  ];

  for (const key of requiredChecks) {
    const state = stateMap[key];
    if (state === 'needs_attention') {
      blockers.push({
        key,
        message: getBlockerMessage(key, ctx),
      });
    }
  }

  if (ctx.checkout.followUpRequired === true) {
    const fu = ctx.checkout.followUpData || {};
    if (!fu.appointmentDate && !ctx.checkout.followUpReason?.trim()) {
      blockers.push({
        key: 'follow_up_scheduled',
        message: 'Follow-up is required. Schedule an appointment or document a follow-up reason.',
      });
    }
  }

  return { canComplete: blockers.length === 0, blockers };
}

function getBlockerMessage(key) {
  const messages = {
    provider_note_signed: 'Provider note is not signed. Checkout cannot be completed until the note is signed.',
    diagnosis_added: 'At least one diagnosis is required before checkout.',
    orders_reviewed: 'All orders must be signed or completed before checkout.',
    medications_reviewed: 'All medication orders must be signed, sent, printed, or administered.',
    follow_up_scheduled: 'Follow-up appointment or reason must be documented.',
    patient_instructions_provided: 'Patient instructions must be provided before checkout.',
    copay_payment_collected: 'Copay or payment must be collected or waived before checkout.',
    insurance_verified: 'Insurance must be verified or marked as self-pay before checkout.',
  };
  return messages[key] || `Checklist item "${key}" requires attention.`;
}

async function updateCheckout(patientId, appointmentId, data, user) {
  const checkout = await prisma.patientCheckout.findUnique({ where: { appointmentId } });
  if (!checkout) {
    const err = new Error('Checkout not found');
    err.statusCode = 404;
    throw err;
  }
  if (checkout.isLocked && checkout.status === 'completed') {
    const err = new Error('Checkout is locked. Reopen checkout to make changes.');
    err.statusCode = 403;
    throw err;
  }

  const updateData = {
    updatedBy: user?.id || null,
    status: checkout.status === 'not_started' ? 'in_progress' : checkout.status,
  };

  if (data.checklistOverrides !== undefined) updateData.checklistOverrides = data.checklistOverrides;
  if (data.followUpRequired !== undefined) updateData.followUpRequired = data.followUpRequired;
  if (data.followUpTimeframe !== undefined) updateData.followUpTimeframe = data.followUpTimeframe;
  if (data.followUpReason !== undefined) updateData.followUpReason = data.followUpReason;
  if (data.followUpData !== undefined) updateData.followUpData = data.followUpData;
  if (data.billingData !== undefined) updateData.billingData = data.billingData;
  if (data.insuranceStatus !== undefined) updateData.insuranceStatus = data.insuranceStatus;
  if (data.documentsMeta !== undefined) updateData.documentsMeta = data.documentsMeta;

  const updated = await prisma.patientCheckout.update({
    where: { id: checkout.id },
    data: updateData,
  });

  await logAudit(checkout.id, 'checkout_updated', user, { fields: Object.keys(data) });
  return updated;
}

async function upsertInstruction(patientId, appointmentId, instructionId, data, user) {
  const checkout = await getOrCreateCheckout(patientId, appointmentId, user);
  if (checkout.isLocked) {
    const err = new Error('Checkout is locked');
    err.statusCode = 403;
    throw err;
  }

  const userName = formatUserName(user);
  if (instructionId) {
    const existing = await prisma.patientCheckoutInstruction.findFirst({
      where: { id: instructionId, checkoutId: checkout.id },
    });
    if (!existing) {
      const err = new Error('Instruction not found');
      err.statusCode = 404;
      throw err;
    }
    return prisma.patientCheckoutInstruction.update({
      where: { id: instructionId },
      data: {
        instructionType: data.instructionType ?? existing.instructionType,
        content: data.content ?? existing.content,
        updatedBy: user?.id || null,
      },
    });
  }

  return prisma.patientCheckoutInstruction.create({
    data: {
      checkoutId: checkout.id,
      instructionType: data.instructionType,
      content: data.content,
      createdBy: user?.id || null,
      createdByName: userName,
    },
  });
}

async function deleteInstruction(patientId, appointmentId, instructionId) {
  const checkout = await prisma.patientCheckout.findUnique({ where: { appointmentId } });
  if (!checkout) {
    const err = new Error('Checkout not found');
    err.statusCode = 404;
    throw err;
  }
  const existing = await prisma.patientCheckoutInstruction.findFirst({
    where: { id: instructionId, checkoutId: checkout.id },
  });
  if (!existing) {
    const err = new Error('Instruction not found');
    err.statusCode = 404;
    throw err;
  }
  await prisma.patientCheckoutInstruction.delete({ where: { id: instructionId } });
}

async function addNote(patientId, appointmentId, data, user) {
  const checkout = await getOrCreateCheckout(patientId, appointmentId, user);
  return prisma.patientCheckoutNote.create({
    data: {
      checkoutId: checkout.id,
      noteType: data.noteType || 'general',
      content: data.content,
      authorId: user?.id || null,
      authorName: formatUserName(user),
    },
  });
}

async function addTask(patientId, appointmentId, data, user) {
  const checkout = await getOrCreateCheckout(patientId, appointmentId, user);
  return prisma.patientCheckoutTask.create({
    data: {
      checkoutId: checkout.id,
      title: data.title,
      assignedTo: data.assignedTo || null,
      assignedToName: data.assignedToName || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      priority: data.priority || 'Normal',
      notes: data.notes || null,
      createdBy: user?.id || null,
    },
  });
}

async function recordPayment(patientId, appointmentId, data, user) {
  const checkout = await getOrCreateCheckout(patientId, appointmentId, user);
  const userName = formatUserName(user);
  const paymentAmount = Number(data.paymentAmount);
  const amountDue = data.amountDue != null ? Number(data.amountDue) : null;
  const balanceRemaining =
    amountDue != null ? Math.max(0, amountDue - paymentAmount) : data.balanceRemaining != null
      ? Number(data.balanceRemaining)
      : null;

  const payment = await prisma.patientCheckoutPayment.create({
    data: {
      checkoutId: checkout.id,
      amountDue: amountDue,
      paymentAmount,
      paymentMethod: data.paymentMethod,
      transactionRef: data.transactionRef || null,
      notes: data.notes || null,
      balanceRemaining,
      receiptNumber: generateReceiptNumber(),
      collectedBy: user?.id || null,
      collectedByName: userName,
    },
  });

  await logAudit(checkout.id, 'payment_recorded', user, { paymentId: payment.id, amount: paymentAmount });
  return payment;
}

async function completeCheckout(patientId, appointmentId, user) {
  const bundle = await getCheckoutBundle(patientId, appointmentId, user);

  const now = new Date();
  const userName = formatUserName(user);

  const [checkout, appointment] = await prisma.$transaction([
    prisma.patientCheckout.update({
      where: { appointmentId },
      data: {
        status: 'completed',
        completedAt: now,
        completedBy: user?.id || null,
        completedByName: userName,
        isLocked: true,
        updatedBy: user?.id || null,
      },
    }),
    prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'Checked Out' },
    }),
    prisma.appointmentHistory.create({
      data: {
        appointmentId,
        action: 'checkout_completed',
        summary: 'Patient checkout completed',
        changedBy: user?.id || null,
        changedByName: userName,
      },
    }),
  ]);

  await logAudit(checkout.id, 'checkout_completed', user, { completedAt: now.toISOString() });

  await prisma.patientActivityLog.create({
    data: {
      patientId,
      action: 'checkout_completed',
      section: 'Checkout',
      tabName: 'Patient Checkout',
      userId: user?.id || null,
      userName,
      changes: {
        appointmentId,
        checkoutId: checkout.id,
        encounterNumber: bundle.header.encounter.encounterNumber,
      },
    },
  });

  return getCheckoutBundle(patientId, appointmentId, user);
}

async function reopenCheckout(patientId, appointmentId, { reason }, user) {
  const checkout = await prisma.patientCheckout.findUnique({ where: { appointmentId } });
  if (!checkout) {
    const err = new Error('Checkout not found');
    err.statusCode = 404;
    throw err;
  }
  if (checkout.status !== 'completed') {
    const err = new Error('Only completed checkouts can be reopened');
    err.statusCode = 400;
    throw err;
  }
  if (!reason?.trim()) {
    const err = new Error('Reopen reason is required');
    err.statusCode = 400;
    throw err;
  }

  const userName = formatUserName(user);
  const now = new Date();

  await prisma.$transaction([
    prisma.patientCheckout.update({
      where: { id: checkout.id },
      data: {
        status: 'in_progress',
        isLocked: false,
        reopenedAt: now,
        reopenedBy: user?.id || null,
        reopenedByName: userName,
        reopenReason: reason.trim(),
        completedAt: null,
        completedBy: null,
        completedByName: null,
        updatedBy: user?.id || null,
      },
    }),
    prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'In Progress' },
    }),
    prisma.appointmentHistory.create({
      data: {
        appointmentId,
        action: 'checkout_reopened',
        summary: `Checkout reopened: ${reason.trim()}`,
        changedBy: user?.id || null,
        changedByName: userName,
      },
    }),
  ]);

  await logAudit(checkout.id, 'checkout_reopened', user, { reason: reason.trim() });

  return getCheckoutBundle(patientId, appointmentId, user);
}

function buildAvsHtml(bundle, clinicInfo = {}) {
  const { header, clinicalReview, medications, orders, referrals, checkout, billing } = bundle;
  const instructions = checkout.instructions || [];
  const fu = checkout.followUpData || {};

  return `<!DOCTYPE html><html><head><title>After Visit Summary</title>
<style>
body{font-family:system-ui,sans-serif;max-width:800px;margin:2rem auto;padding:0 1rem;color:#111}
h1{font-size:1.5rem;border-bottom:2px solid #333;padding-bottom:.5rem}
h2{font-size:1.1rem;margin-top:1.5rem;color:#333}
.section{margin-bottom:1rem}
.meta{color:#555;font-size:.9rem}
ul{padding-left:1.25rem}
</style></head><body>
<h1>After Visit Summary</h1>
<div class="section meta">
  <strong>${header.patient.name}</strong> · MRN ${header.patient.mrn}<br/>
  DOB: ${header.patient.dateOfBirth ? new Date(header.patient.dateOfBirth).toLocaleDateString() : '—'} · ${header.patient.gender || '—'}
</div>
<div class="section">
  <strong>Visit Date:</strong> ${header.encounter.visitDate} ${header.encounter.appointmentTime || ''}<br/>
  <strong>Provider:</strong> ${header.encounter.provider || '—'}<br/>
  <strong>Location:</strong> ${header.encounter.location || '—'}
</div>
<h2>Diagnosis</h2>
<ul>${clinicalReview.diagnoses.map((d) => `<li>${d.code ? d.code + ' — ' : ''}${d.description}</li>`).join('') || '<li>None documented</li>'}</ul>
<h2>Medications</h2>
<ul>${medications.map((m) => `<li>${m.medicationName} ${m.dose || ''} ${m.frequency || ''} — ${m.status}</li>`).join('') || '<li>None prescribed this visit</li>'}</ul>
<h2>Orders</h2>
<ul>${orders.map((o) => `<li>${o.orderType}: ${o.procedureName} (${o.status})</li>`).join('') || '<li>None</li>'}</ul>
<h2>Referrals</h2>
<ul>${referrals.map((r) => `<li>${r.specialty} → ${r.referredTo || 'TBD'} (${r.status})</li>`).join('') || '<li>None</li>'}</ul>
<h2>Follow-Up</h2>
<p>${checkout.followUpReason || fu.reason || '—'}${fu.appointmentDate ? `<br/>Next appointment: ${fu.appointmentDate} ${fu.appointmentTime || ''}` : ''}</p>
<h2>Patient Instructions</h2>
${instructions.map((i) => `<div><strong>${i.instructionType}:</strong><pre style="white-space:pre-wrap;font-family:inherit">${i.content}</pre></div>`).join('') || '<p>None provided</p>'}
<h2>Clinic Contact</h2>
<p>${clinicInfo.name || 'Clinic'}<br/>${clinicInfo.phone || ''} ${clinicInfo.address || ''}</p>
</body></html>`;
}

module.exports = {
  CHECKOUT_STATUSES,
  CHECKLIST_ITEMS,
  CHECKLIST_STATES,
  getCheckoutBundle,
  updateCheckout,
  upsertInstruction,
  deleteInstruction,
  addNote,
  addTask,
  recordPayment,
  completeCheckout,
  reopenCheckout,
  buildAvsHtml,
};
