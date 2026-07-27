import { calcAge, formatPatientName } from '@/pages/patient-dashboard/patientChartUtils';
import { STATUS_SOFT } from '@/lib/statusColors';

export { calcAge, formatPatientName };

export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatTime(value) {
  if (!value) return '';
  let d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    const m = String(value).match(/^(\d{1,2}):(\d{2})/);
    if (!m) return '';
    d = new Date();
    d.setHours(Number(m[1]), Number(m[2]), 0, 0);
  }
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function orDash(value) {
  if (value === null || value === undefined || value === '') return '—';
  return value;
}

export function normalizeStatusKey(status) {
  return String(status || '').trim().toLowerCase().replace(/[\s_]+/g, '-');
}

export function patientStatusLabel(patient) {
  const raw = patient?.patientStatus || patient?.status || 'Active';
  return String(raw).replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const STATUS_CLASS = {
  active: `border ${STATUS_SOFT.success}`,
  inactive: `border ${STATUS_SOFT.muted}`,
  deceased: `border ${STATUS_SOFT.danger}`,
};

/**
 * Resolve a patient's status into a display-ready badge descriptor.
 */
export function resolvePatientStatus(patient) {
  const key = normalizeStatusKey(patient?.patientStatus || patient?.status || 'Active');
  return {
    key,
    label: patientStatusLabel(patient),
    className: STATUS_CLASS[key] || STATUS_CLASS.inactive,
  };
}

/**
 * Build a coarse permission map from the current user's roles. This mirrors the
 * roles listed in the spec. The backend remains the source of truth; this only
 * hides UI affordances the user cannot use.
 */
export function buildPermissions(user) {
  const roleNames = (user?.roles || [])
    .map((r) => (typeof r === 'string' ? r : r?.name))
    .filter(Boolean)
    .map((r) => r.toLowerCase());

  const singular = (user?.role || '').toLowerCase();
  if (singular) roleNames.push(singular);

  const has = (...names) => names.some((n) => roleNames.some((r) => r.includes(n)));
  const isAdmin = has('admin') || roleNames.length === 0; // default-open when roles unknown

  return {
    roleNames,
    isAdmin,
    view: true,
    clinical: isAdmin || has('provider', 'physician', 'nurse', 'medical assistant', 'clinician'),
    prescribe: isAdmin || has('provider', 'physician'),
    scheduling: isAdmin || has('provider', 'nurse', 'front desk', 'registration', 'scheduler'),
    communications: isAdmin || has('provider', 'nurse', 'front desk', 'registration', 'referral'),
    documents: isAdmin || has('provider', 'nurse', 'medical assistant', 'front desk', 'registration'),
    demographics: isAdmin || has('front desk', 'registration', 'nurse', 'provider'),
    billing: isAdmin || has('billing'),
    audit: isAdmin || has('compliance', 'provider'),
  };
}

export function canViewSection(section, permissions) {
  if (!section?.roles) return true;
  if (permissions?.isAdmin) return true;
  return section.roles.some((role) =>
    (permissions?.roleNames || []).some((r) => r.includes(role.replace(' staff', '').trim())),
  );
}

export function canRunAction(action, permissions) {
  if (!action?.perm) return true;
  return Boolean(permissions?.[action.perm] ?? permissions?.view);
}

const HIGH_SEVERITY = ['severe', 'critical', 'high', 'life-threatening', 'anaphylaxis'];

export function isHighSeverity(severity) {
  const s = String(severity || '').toLowerCase();
  return HIGH_SEVERITY.some((k) => s.includes(k));
}

const MODERATE_SEVERITY = ['moderate', 'medium'];

/**
 * Tailwind badge classes reflecting an allergy/problem severity level.
 */
export function severityClass(severity) {
  if (isHighSeverity(severity)) {
    return `border ${STATUS_SOFT.danger}`;
  }
  const s = String(severity || '').toLowerCase();
  if (MODERATE_SEVERITY.some((k) => s.includes(k))) {
    return `border ${STATUS_SOFT.warning}`;
  }
  return `border ${STATUS_SOFT.muted}`;
}

/**
 * Derive the safety-alert banner content from patient + summary data.
 */
export function buildSafetyAlerts({ patient, summary }) {
  const alerts = [];
  const allergies = summary?.allergies || [];
  const nkda = summary?.noKnownDrugAllergies ?? patient?.noKnownDrugAllergies;

  if (allergies.length > 0) {
    allergies.forEach((a) => {
      alerts.push({
        id: `allergy-${a.id || a.allergenName}`,
        kind: 'allergy',
        severity: a.severity,
        critical: isHighSeverity(a.severity),
        label: [a.allergenName, a.severity, a.reaction].filter(Boolean).join(' — '),
        targetSection: 'allergies',
      });
    });
  } else if (nkda) {
    alerts.push({ id: 'nkda', kind: 'nkda', label: 'No Known Allergies', targetSection: 'allergies' });
  } else {
    alerts.push({ id: 'allergy-unreviewed', kind: 'warning', label: 'Allergy status not reviewed', targetSection: 'allergies' });
  }

  if (patient?.interpreterRequired) {
    alerts.push({
      id: 'interpreter',
      kind: 'info',
      label: `Interpreter required${patient.interpreterLanguageRequired ? `: ${patient.interpreterLanguageRequired}` : ''}`,
    });
  }

  const accessibility = parseJsonArray(patient?.accessibilityRequirements);
  accessibility.forEach((req, i) => {
    alerts.push({ id: `access-${i}`, kind: 'info', label: typeof req === 'string' ? req : req?.label || 'Accessibility need' });
  });

  if (patient?.patientStatus && normalizeStatusKey(patient.patientStatus) === 'deceased') {
    alerts.push({
      id: 'deceased',
      kind: 'critical',
      label: `Deceased${patient.dateOfDeath ? ` — ${formatDate(patient.dateOfDeath)}` : ''}`,
    });
  }

  return alerts;
}

export function parseJsonArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value.trim() ? [value] : [];
    }
  }
  return [];
}

/**
 * Normalize insurance records from the patient payload into primary/secondary/tertiary.
 */
export function normalizeInsurances(patient) {
  const list = patient?.insuranceList || patient?.insurances || [];
  return list.map((ins) => {
    const type = String(ins.insuranceTypeKey || ins.insuranceType || 'primary').toLowerCase();
    return {
      id: ins.id || `${type}-${ins.memberId || ''}`,
      type: type.includes('secondary') ? 'Secondary' : type.includes('tertiary') ? 'Tertiary' : 'Primary',
      payerName: ins.payerName || ins.insuranceProvider?.name || ins.insuranceCompany || '—',
      planName: ins.planName || ins.policyType || '—',
      memberId: ins.memberId || ins.policyNumber || '—',
      groupNumber: ins.groupNumber || '—',
      subscriberName:
        ins.subscriberName ||
        [ins.subscriberFirstName, ins.subscriberLastName].filter(Boolean).join(' ') ||
        '—',
      subscriberRelationship: ins.subscriberRelationship || ins.relationshipToPatient || '—',
      subscriberDob: ins.subscriberDateOfBirth || null,
      effectiveDate: ins.coverageStartDate || ins.effectiveDate || null,
      expiryDate: ins.coverageEndDate || ins.expiryDate || null,
      copay: ins.copay,
      deductible: ins.deductible,
      eligibilityStatus: ins.eligibilityStatus || ins.status || 'Not Verified',
      authorizationNumber: ins.authorizationNumber || '—',
      frontCard: ins.frontCardImage || ins.cardFront || null,
      backCard: ins.backCardImage || ins.cardBack || null,
    };
  });
}

/**
 * Emergency/related contacts derived from the patient payload. The patient
 * registration flow stores a primary emergency contact inline and may store
 * additional contacts in an array.
 */
export function normalizeContacts(patient) {
  const contacts = [];
  if (patient?.emergencyContactName) {
    contacts.push({
      id: 'primary-ec',
      name: patient.emergencyContactName,
      type: 'Primary Emergency Contact',
      relationship: patient.emergencyContactRelationship || '—',
      phone: patient.emergencyContactNumber || '—',
      email: patient.emergencyContactEmail || '—',
      address: [
        patient.emergencyContactAddress,
        [patient.emergencyContactCity, patient.emergencyContactState, patient.emergencyContactZip]
          .filter(Boolean)
          .join(', '),
      ]
        .filter(Boolean)
        .join(' · ') || '—',
      primary: true,
      active: true,
    });
  }

  const extra =
    patient?.additionalContacts ||
    patient?.contacts ||
    patient?.emergencyContacts ||
    [];
  parseJsonArray(extra).forEach((c, i) => {
    if (!c) return;
    contacts.push({
      id: c.id || `contact-${i}`,
      name: c.name || [c.firstName, c.lastName].filter(Boolean).join(' ') || '—',
      type: c.contactType || c.type || 'Contact',
      relationship: c.relationship || '—',
      phone: c.phone || c.phoneNumber || c.contactNumber || '—',
      email: c.email || '—',
      address: c.address || '—',
      authorized: c.authorizedToReceiveInfo ?? c.authorized ?? null,
      primary: false,
      active: c.active ?? true,
    });
  });

  return contacts;
}

export function fullAddress(patient) {
  if (!patient) return '—';
  const line1 = [patient.address, patient.addressLine2].filter(Boolean).join(', ');
  const line2 = [patient.city, patient.state, patient.zip].filter(Boolean).join(', ');
  const parts = [line1, line2, patient.country && patient.country !== 'US' ? patient.country : null].filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
}

export function primaryPhone(patient) {
  return patient?.cellPhone || patient?.contactNumber || patient?.homePhone || patient?.workPhone || '—';
}
