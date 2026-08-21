import { CHARGE_ROUTING_OPTIONS, ICD_POINTERS } from './claimConstants';

export const FREQUENCY_OPTIONS = [
  { value: '1', label: '1 - Original Claim' },
  { value: '7', label: '7 - Replacement' },
  { value: '8', label: '8 - Void/Cancel' },
];

export const POLICY_TYPE_OPTIONS = [
  'auto insurance policy',
  'group policy',
  'individual policy',
  'long term policy',
  'ligitation',
  'medicare primary',
  'self payment',
  'supplimental policy',
  'Others',
];

export const REFERRAL_TYPE_OPTIONS = [
  { value: 'Prior Auth Number', label: 'Prior Auth Number' },
  { value: 'Referral Number', label: 'Referral Number' },
  { value: 'None', label: 'None' },
];

export function emptyInsuranceDetails() {
  return {
    memberId: '',
    policyType: 'group policy',
    copayDue: '0.00',
    groupNumber: '',
    claimControlRef: '',
    authorizationNumber: '',
    referralType: 'Prior Auth Number',
    subscriberName: '',
    subscriberDob: '',
    subscriberRelationship: '',
    subscriberFirstName: '',
    subscriberLastName: '',
  };
}

export function emptyChargeLine() {
  return {
    id: null,
    from: '',
    to: '',
    procedure: '',
    inventory: '',
    chiro: false,
    pos: '',
    tos: '',
    mod1: '',
    mod2: '',
    mod3: '',
    mod4: '',
    unitPrice: '0.00',
    dxPointers: '',
    units: '1.00',
    amount: '0.00',
    status: 'no_change',
  };
}

export function createEmptyCms1500Form() {
  return {
    id: null,
    appointmentId: '',
    claimNumber: '',
    claimRef: '',
    frequencyCode: '1',
    claimStatus: 'draft',
    patientId: '',
    patientLabel: '',
    renderingProviderId: '',
    renderingProviderLabel: '',
    billingProviderId: '',
    billingProviderLabel: '',
    supervisingProviderId: '',
    supervisingProviderLabel: '',
    orderingProviderId: '',
    orderingProviderLabel: '',
    referringProviderId: '',
    referringProviderLabel: '',
    facilityId: '',
    facilityLabel: '',
    officeLocation: '',
    primaryPayerId: '',
    primaryPayerLabel: '',
    secondaryPayerId: '',
    secondaryPayerLabel: '',
    tertiaryPayerId: '',
    tertiaryPayerLabel: '',
    primaryDetails: emptyInsuranceDetails(),
    secondaryDetails: emptyInsuranceDetails(),
    tertiaryDetails: emptyInsuranceDetails(),
    icdCodes: ICD_POINTERS.map(() => ({ diagnosisCodeId: '', code: '', description: '' })),
    setAllChargesTo: 'no_change',
    updatePatientDefaults: false,
    charges: [emptyChargeLine()],
    employmentRelated: 'No',
    autoAccident: 'No',
    otherAccident: 'No',
    accidentDate: '',
    lastMenstrualPeriod: '',
    initialTreatmentDate: '',
    dateLastSeen: '',
    unableToWorkFrom: '',
    unableToWorkTo: '',
    patientHomebound: 'No',
    showBoxNumbers: 'none',
    autoAccidentState: '',
    claimCodes: '',
    otherClaimId: '',
    additionalClaimInfo: '',
    claimNote: '',
    resubmitReasonCode: '',
    delayReasonCode: 'none',
    hospitalizedFrom: '',
    hospitalizedTo: '',
    labCharges: '0.00',
    specialProgramCode: '',
    patientSignatureOnFile: 'Yes',
    insuredSignatureOnFile: 'yes',
    providerAcceptAssignment: 'Default',
    documentationMethod: 'No documentation',
    documentationType: '',
    documentationTypeOther: '',
    patientHeight: '0',
    patientWeight: '0',
    serviceAuthException: '',
    demonstrationProject: '',
    mammographyCert: '',
    investigationalDevice: '',
    ambulatoryPatientGroup: '',
    ambulanceClaim: 'No',
    transportReason: '',
    transportMiles: '0.00',
    ambulancePatientWeight: '0',
    roundTripReason: '',
    stretcherReason: '',
    pickupAddress: { line1: '', line2: '', city: '', state: '', zip: '', international: false },
    dropoffAddress: { name: '', line1: '', line2: '', city: '', state: '', zip: '' },
    certificationFields: {},
  };
}

function providerLabel(provider) {
  if (!provider) return '';
  const name = provider.name || [provider.firstName, provider.middleName, provider.lastName].filter(Boolean).join(' ');
  return [name, provider.npi ? `NPI ${provider.npi}` : ''].filter(Boolean).join(' · ');
}

function insuranceFromApi(claim, tier) {
  const row = (claim.insurances || []).find((i) => i.tier === tier) || {};
  return {
    memberId: row.memberId || '',
    policyType: row.policyType || 'group policy',
    copayDue: row.copayDue != null ? Number(row.copayDue).toFixed(2) : '0.00',
    groupNumber: row.groupNumber || '',
    claimControlRef: row.claimControlRef || '',
    authorizationNumber: row.authorizationNumber || '',
    referralType: row.referralType || 'Prior Auth Number',
    subscriberName: row.subscriberName || '',
    subscriberDob: row.subscriberDob || '',
    subscriberRelationship: row.subscriberRelationship || '',
    subscriberFirstName: row.subscriberFirstName || '',
    subscriberLastName: row.subscriberLastName || '',
  };
}

function yn(value) {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return value || 'No';
}

export function formFromApi(claim) {
  const form = createEmptyCms1500Form();
  if (!claim) return form;
  const info = claim.additionalInfo || {};
  const amb = claim.ambulanceInfo || {};
  const dxByPointer = Object.fromEntries((claim.diagnoses || []).map((dx) => [dx.pointer, dx]));

  return {
    ...form,
    id: claim.id,
    appointmentId: claim.appointmentId || '',
    claimNumber: claim.claimNumber || '',
    claimRef: claim.claimRef || '',
    frequencyCode: claim.frequencyCode || '1',
    claimStatus: claim.claimStatus || claim.status || 'draft',
    patientId: claim.patientId || '',
    patientLabel: claim.patient
      ? [claim.patient.lastName, claim.patient.firstName].filter(Boolean).join(', ')
        + (claim.patient.mrn ? ` · ${claim.patient.mrn}` : '')
      : claim.patientName || '',
    renderingProviderId: claim.renderingProviderId || '',
    renderingProviderLabel: providerLabel(claim.renderingProvider),
    billingProviderId: claim.billingProviderId || '',
    billingProviderLabel: providerLabel(claim.billingProvider),
    supervisingProviderId: claim.supervisingProviderId || '',
    supervisingProviderLabel: providerLabel(claim.supervisingProvider),
    orderingProviderId: claim.orderingProviderId || '',
    orderingProviderLabel: providerLabel(claim.orderingProvider),
    referringProviderId: claim.referringProviderId || '',
    referringProviderLabel: providerLabel(claim.referringProvider),
    facilityId: claim.facilityId || '',
    facilityLabel: claim.facility?.label || claim.facility?.name || '',
    officeLocation: claim.officeLocation || '',
    primaryPayerId: claim.primaryPayerId || '',
    primaryPayerLabel: claim.primaryPayer?.name || '',
    secondaryPayerId: claim.secondaryPayerId || '',
    secondaryPayerLabel: claim.secondaryPayer?.name || '',
    tertiaryPayerId: claim.tertiaryPayerId || '',
    tertiaryPayerLabel: claim.tertiaryPayer?.name || '',
    primaryDetails: insuranceFromApi(claim, 'primary'),
    secondaryDetails: insuranceFromApi(claim, 'secondary'),
    tertiaryDetails: insuranceFromApi(claim, 'tertiary'),
    icdCodes: ICD_POINTERS.map((pointer) => ({
      diagnosisCodeId: dxByPointer[pointer]?.diagnosisCodeId || '',
      code: dxByPointer[pointer]?.code || '',
      description: dxByPointer[pointer]?.description || '',
    })),
    charges: (claim.charges || claim.lines || []).length
      ? (claim.charges || claim.lines).map((line) => ({
          id: line.id,
          from: line.serviceFromDate || line.serviceDate || '',
          to: line.serviceToDate || '',
          procedure: line.procedureCode || line.cptCode || line.hcpcsCode || '',
          inventory: line.inventoryCode || '',
          chiro: !!line.chiropractic,
          pos: line.placeOfService || '',
          tos: line.typeOfService || '',
          mod1: line.modifier1 || '',
          mod2: line.modifier2 || '',
          mod3: line.modifier3 || '',
          mod4: line.modifier4 || '',
          unitPrice: Number(line.unitCharge || 0).toFixed(2),
          dxPointers: line.diagnosisPointer || line.diagnosisPointers || '',
          units: Number(line.units || 1).toFixed(2),
          amount: Number(line.chargeAmount || line.lineTotal || 0).toFixed(2),
          status: line.chargeStatus || 'no_change',
        }))
      : [emptyChargeLine()],
    employmentRelated: yn(info.employmentRelated),
    autoAccident: yn(info.autoAccident),
    otherAccident: yn(info.otherAccident),
    accidentDate: info.onsetDate || '',
    lastMenstrualPeriod: info.lastMenstrualPeriod || '',
    initialTreatmentDate: info.initialTreatmentDate || '',
    dateLastSeen: info.dateLastSeen || '',
    unableToWorkFrom: info.unableToWorkFrom || '',
    unableToWorkTo: info.unableToWorkTo || '',
    patientHomebound: info.patientHomebound || 'No',
    showBoxNumbers: info.showBoxNumbers || 'none',
    autoAccidentState: info.accidentState || '',
    claimCodes: info.claimCodes || '',
    otherClaimId: info.otherClaimId || '',
    additionalClaimInfo: info.additionalClaimInfo || '',
    claimNote: info.notes || claim.notes || '',
    resubmitReasonCode: info.resubmissionCode || '',
    delayReasonCode: info.delayReasonCode || 'none',
    hospitalizedFrom: info.hospitalizationFrom || '',
    hospitalizedTo: info.hospitalizationTo || '',
    labCharges: info.labCharge != null ? Number(info.labCharge).toFixed(2) : '0.00',
    specialProgramCode: info.specialProgramCode || '',
    patientSignatureOnFile: info.patientSignatureOnFile || 'Yes',
    insuredSignatureOnFile: info.insuredSignatureOnFile || 'yes',
    providerAcceptAssignment: info.providerAcceptAssignment || 'Default',
    documentationMethod: info.documentationMethod || 'No documentation',
    documentationType: info.documentationType || '',
    documentationTypeOther: info.documentationTypeOther || '',
    patientHeight: info.patientHeight || '0',
    patientWeight: info.patientWeight || '0',
    serviceAuthException: info.serviceAuthException || '',
    demonstrationProject: info.demonstrationProject || '',
    mammographyCert: info.mammographyCert || '',
    investigationalDevice: info.investigationalDevice || '',
    ambulatoryPatientGroup: info.ambulatoryPatientGroup || '',
    ambulanceClaim: yn(amb.isAmbulanceClaim),
    transportReason: amb.ambulanceTransportReason || '',
    transportMiles: amb.transportMiles != null ? Number(amb.transportMiles).toFixed(2) : '0.00',
    ambulancePatientWeight: amb.patientWeight != null ? String(amb.patientWeight) : '0',
    roundTripReason: amb.roundTripReason || '',
    stretcherReason: amb.stretcherReason || '',
    pickupAddress: {
      line1: amb.pickupAddress?.line1 || '',
      line2: amb.pickupAddress?.line2 || '',
      city: amb.pickupAddress?.city || '',
      state: amb.pickupAddress?.state || '',
      zip: amb.pickupAddress?.zip || '',
      international: !!amb.pickupAddress?.international,
    },
    dropoffAddress: {
      name: amb.dropoffAddress?.name || '',
      line1: amb.dropoffAddress?.line1 || '',
      line2: amb.dropoffAddress?.line2 || '',
      city: amb.dropoffAddress?.city || '',
      state: amb.dropoffAddress?.state || '',
      zip: amb.dropoffAddress?.zip || '',
    },
    certificationFields: amb.certifications || {},
  };
}

function insurancePayload(tier, payerId, details) {
  return {
    tier,
    payerId: payerId || null,
    memberId: details.memberId || null,
    groupNumber: details.groupNumber || null,
    policyType: details.policyType || null,
    subscriberName: details.subscriberName || null,
    subscriberFirstName: details.subscriberFirstName || null,
    subscriberLastName: details.subscriberLastName || null,
    subscriberDob: details.subscriberDob || null,
    subscriberRelationship: details.subscriberRelationship || null,
    copayDue: details.copayDue === '' ? null : Number(details.copayDue),
    authorizationNumber: details.authorizationNumber || null,
    referralType: details.referralType || null,
    claimControlRef: details.claimControlRef || null,
  };
}

export function formToPayload(form) {
  return {
    patientId: form.patientId || undefined,
    appointmentId: form.appointmentId || null,
    renderingProviderId: form.renderingProviderId || undefined,
    billingProviderId: form.billingProviderId || undefined,
    supervisingProviderId: form.supervisingProviderId || null,
    orderingProviderId: form.orderingProviderId || null,
    referringProviderId: form.referringProviderId || null,
    facilityId: form.facilityId || null,
    primaryPayerId: form.primaryPayerId || null,
    secondaryPayerId: form.secondaryPayerId || null,
    tertiaryPayerId: form.tertiaryPayerId || null,
    officeLocation: form.officeLocation || null,
    claimRef: form.claimRef || null,
    frequencyCode: form.frequencyCode || '1',
    claimStatus: form.claimStatus || 'draft',
    notes: form.claimNote || null,
    insurances: [
      insurancePayload('primary', form.primaryPayerId, form.primaryDetails),
      insurancePayload('secondary', form.secondaryPayerId, form.secondaryDetails),
      insurancePayload('tertiary', form.tertiaryPayerId, form.tertiaryDetails),
    ],
    diagnoses: form.icdCodes
      .map((dx, idx) => ({
        pointer: ICD_POINTERS[idx],
        diagnosisCodeId: dx.diagnosisCodeId || null,
        code: dx.code || null,
        description: dx.description || null,
      }))
      .filter((dx) => dx.code || dx.diagnosisCodeId),
    charges: form.charges.map((row) => {
      const units = Number(row.units || 0);
      const unitCharge = Number(row.unitPrice || 0);
      return {
        id: row.id || null,
        serviceFromDate: row.from || null,
        serviceToDate: row.to || null,
        placeOfService: row.pos || null,
        typeOfService: row.tos || null,
        procedureCode: row.procedure || null,
        modifier1: row.mod1 || null,
        modifier2: row.mod2 || null,
        modifier3: row.mod3 || null,
        modifier4: row.mod4 || null,
        diagnosisPointer: row.dxPointers || null,
        units,
        unitCharge,
        chargeAmount: Number(row.amount || units * unitCharge),
        chargeStatus: row.status || 'no_change',
        inventoryCode: row.inventory || null,
        chiropractic: !!row.chiro,
      };
    }),
    additionalInfo: {
      employmentRelated: form.employmentRelated === 'Yes',
      autoAccident: form.autoAccident === 'Yes',
      accidentState: form.autoAccidentState || null,
      otherAccident: form.otherAccident === 'Yes',
      onsetDate: form.accidentDate || null,
      lastMenstrualPeriod: form.lastMenstrualPeriod || null,
      initialTreatmentDate: form.initialTreatmentDate || null,
      dateLastSeen: form.dateLastSeen || null,
      unableToWorkFrom: form.unableToWorkFrom || null,
      unableToWorkTo: form.unableToWorkTo || null,
      hospitalizationFrom: form.hospitalizedFrom || null,
      hospitalizationTo: form.hospitalizedTo || null,
      patientHomebound: form.patientHomebound || null,
      outsideLab: Number(form.labCharges) > 0,
      labCharge: Number(form.labCharges || 0),
      resubmissionCode: form.resubmitReasonCode || null,
      claimCodes: form.claimCodes || null,
      otherClaimId: form.otherClaimId || null,
      additionalClaimInfo: form.additionalClaimInfo || null,
      notes: form.claimNote || null,
      delayReasonCode: form.delayReasonCode || null,
      specialProgramCode: form.specialProgramCode || null,
      patientSignatureOnFile: form.patientSignatureOnFile || null,
      insuredSignatureOnFile: form.insuredSignatureOnFile || null,
      providerAcceptAssignment: form.providerAcceptAssignment || null,
      documentationMethod: form.documentationMethod || null,
      documentationType: form.documentationType || null,
      documentationTypeOther: form.documentationTypeOther || null,
      patientHeight: form.patientHeight || null,
      patientWeight: form.patientWeight || null,
      serviceAuthException: form.serviceAuthException || null,
      demonstrationProject: form.demonstrationProject || null,
      mammographyCert: form.mammographyCert || null,
      investigationalDevice: form.investigationalDevice || null,
      ambulatoryPatientGroup: form.ambulatoryPatientGroup || null,
      showBoxNumbers: form.showBoxNumbers || null,
    },
    ambulanceInfo: {
      isAmbulanceClaim: form.ambulanceClaim === 'Yes',
      ambulanceTransportReason: form.transportReason || null,
      transportMiles: Number(form.transportMiles || 0),
      mileage: Number(form.transportMiles || 0),
      patientWeight: Number(form.ambulancePatientWeight || 0),
      roundTripReason: form.roundTripReason || null,
      stretcherReason: form.stretcherReason || null,
      pickupAddress: form.pickupAddress,
      dropoffAddress: form.dropoffAddress,
      certifications: form.certificationFields,
    },
  };
}

function extractPos(value) {
  if (!value) return '';
  const match = String(value).match(/\d{2}/);
  return match ? match[0] : String(value);
}

function splitModifiers(value) {
  if (!value) return ['', '', '', ''];
  const parts = Array.isArray(value)
    ? value
    : String(value).split(/[,\s/]+/).map((part) => part.trim()).filter(Boolean);
  return [0, 1, 2, 3].map((idx) => parts[idx] || '');
}

function normalizeInsuranceTier(value) {
  return String(value || '').trim().toLowerCase();
}

function pickEncounterInsurance(list, tier) {
  const target = normalizeInsuranceTier(tier);
  return list.find((ins) => normalizeInsuranceTier(ins.insuranceType) === target)
    || list.find((ins) => normalizeInsuranceTier(ins.insuranceType).startsWith(target));
}

function mapEncounterInsuranceDetails(ins) {
  if (!ins) return emptyInsuranceDetails();
  const first = ins.subscriberFirstName || '';
  const last = ins.subscriberLastName || '';
  const subscriberName = ins.subscriberName
    || [last, first].filter(Boolean).join(', ');
  return {
    ...emptyInsuranceDetails(),
    memberId: ins.memberId || '',
    groupNumber: ins.groupNumber || '',
    policyType: ins.policyType || 'group policy',
    authorizationNumber: ins.authorizationNumber || '',
    subscriberFirstName: first,
    subscriberLastName: last,
    subscriberName,
    subscriberDob: ins.subscriberDateOfBirth ? String(ins.subscriberDateOfBirth).slice(0, 10) : '',
    subscriberRelationship: ins.subscriberRelationship || '',
    copayDue: ins.copay != null ? Number(ins.copay).toFixed(2) : '0.00',
  };
}

/** Map encounter coverage tab insurances onto the claim form (fields remain editable). */
export function applyEncounterCoverage(form, encounter) {
  const list = encounter?.coverage?.insurances || [];
  const primary = pickEncounterInsurance(list, 'primary') || list[0];
  const secondary = pickEncounterInsurance(list, 'secondary');
  const tertiary = pickEncounterInsurance(list, 'tertiary');

  return {
    ...form,
    primaryPayerId: primary?.insuranceProviderId || form.primaryPayerId,
    primaryPayerLabel: primary?.payerName || form.primaryPayerLabel,
    primaryDetails: primary ? mapEncounterInsuranceDetails(primary) : form.primaryDetails,
    secondaryPayerId: secondary?.insuranceProviderId || '',
    secondaryPayerLabel: secondary?.payerName || '',
    secondaryDetails: secondary ? mapEncounterInsuranceDetails(secondary) : emptyInsuranceDetails(),
    tertiaryPayerId: tertiary?.insuranceProviderId || '',
    tertiaryPayerLabel: tertiary?.payerName || '',
    tertiaryDetails: tertiary ? mapEncounterInsuranceDetails(tertiary) : emptyInsuranceDetails(),
  };
}

export function formFromEncounter(encounter) {
  const form = createEmptyCms1500Form();
  if (!encounter) return form;

  const person = encounter.patient || {};
  const provider = encounter.provider || {};
  const dos = encounter.dateOfService || '';
  const pos = extractPos(encounter.placeOfService);
  const diagnoses = Array.isArray(encounter.diagnoses) ? encounter.diagnoses : [];
  const charges = (Array.isArray(encounter.charges) ? encounter.charges : [])
    .filter((line) => line.cptCode?.trim() || line.hcpcsCode?.trim());

  const icdCodes = ICD_POINTERS.map((pointer, idx) => {
    const dx = diagnoses.find((row) => row.pointer === pointer) || diagnoses[idx];
    if (!dx) return { diagnosisCodeId: '', code: '', description: '' };
    return {
      diagnosisCodeId: dx.catalogId || dx.diagnosisCodeId || '',
      code: dx.code || '',
      description: dx.description || '',
    };
  });

  const chargeLines = charges.length
    ? charges.map((line) => {
        const [mod1, mod2, mod3, mod4] = splitModifiers(line.modifiers);
        const units = Number(line.units || 1);
        const unitPrice = Number(line.unitCharge || 0);
        return {
          ...emptyChargeLine(),
          from: dos,
          to: dos,
          procedure: line.cptCode || line.hcpcsCode || '',
          pos: extractPos(line.placeOfService) || pos,
          mod1,
          mod2,
          mod3,
          mod4,
          unitPrice: unitPrice.toFixed(2),
          dxPointers: line.diagnosisPointers || 'A',
          units: units.toFixed(2),
          amount: (units * unitPrice).toFixed(2),
        };
      })
    : [{ ...emptyChargeLine(), from: dos, to: dos, pos }];

  const patientLabel = person.displayName
    ? `${person.displayName}${person.mrn ? ` · ${person.mrn}` : ''}`
    : [[person.lastName, person.firstName].filter(Boolean).join(', '), person.mrn]
        .filter(Boolean)
        .join(' · ');

  const providerText = provider.name
    ? [provider.name, provider.npi ? `NPI ${provider.npi}` : ''].filter(Boolean).join(' · ')
    : '';

  return applyEncounterCoverage({
    ...form,
    appointmentId: encounter.id || '',
    patientId: person.id || '',
    patientLabel,
    renderingProviderId: provider.id || '',
    renderingProviderLabel: providerText,
    officeLocation: encounter.department || '',
    icdCodes,
    charges: chargeLines,
    claimNote: encounter.visitReason || '',
    additionalClaimInfo: [encounter.visitType, encounter.visitReason].filter(Boolean).join(' — '),
  }, encounter);
}

export function applySetAllCharges(form, routing) {
  if (!routing || routing === 'no_change') return form;
  if (!CHARGE_ROUTING_OPTIONS.some((o) => o.value === routing)) return form;
  return {
    ...form,
    setAllChargesTo: routing,
    charges: form.charges.map((row) => ({ ...row, status: routing })),
  };
}

export function applyPatientInsurance(form, patient) {
  if (!patient) return form;
  const list = patient.insuranceList || patient.insurances || [];
  const pick = (type) => list.find((i) => String(i.insuranceType || i.insuranceTypeKey || '').toLowerCase() === type);
  const primary = pick('primary') || list[0];
  const secondary = pick('secondary');
  const tertiary = pick('tertiary');

  const mapDetails = (ins) => {
    if (!ins) return emptyInsuranceDetails();
    const first = ins.subscriberFirstName || '';
    const last = ins.subscriberLastName || '';
    return {
      ...emptyInsuranceDetails(),
      memberId: ins.memberId || ins.policyNumber || '',
      groupNumber: ins.groupNumber || '',
      policyType: ins.policyType || 'group policy',
      authorizationNumber: ins.authorizationNumber || '',
      subscriberFirstName: first,
      subscriberLastName: last,
      subscriberName: [last, first].filter(Boolean).join(', '),
      subscriberDob: ins.subscriberDateOfBirth ? String(ins.subscriberDateOfBirth).slice(0, 10) : '',
      subscriberRelationship: ins.subscriberRelationship || '',
      copayDue: ins.copay != null ? Number(ins.copay).toFixed(2) : '0.00',
    };
  };

  return {
    ...form,
    primaryPayerId: primary?.insuranceProviderId || form.primaryPayerId,
    primaryPayerLabel: primary?.payerName || form.primaryPayerLabel,
    primaryDetails: primary ? mapDetails(primary) : form.primaryDetails,
    secondaryPayerId: secondary?.insuranceProviderId || '',
    secondaryPayerLabel: secondary?.payerName || '',
    secondaryDetails: secondary ? mapDetails(secondary) : emptyInsuranceDetails(),
    tertiaryPayerId: tertiary?.insuranceProviderId || '',
    tertiaryPayerLabel: tertiary?.payerName || '',
    tertiaryDetails: tertiary ? mapDetails(tertiary) : emptyInsuranceDetails(),
  };
}

export function validateCms1500Form(form) {
  const errors = {};
  if (!form.patientId) errors.patientId = 'Patient is required';
  if (!form.renderingProviderId) errors.renderingProviderId = 'Rendering provider is required';
  if (!form.billingProviderId) errors.billingProviderId = 'Billing provider is required';
  if (form.autoAccident === 'Yes' && !form.autoAccidentState) {
    errors['additionalInfo.accidentState'] = 'Accident state is required when auto accident is yes';
  }
  form.charges.forEach((row, idx) => {
    if (Number(row.units) < 0) errors[`charges.${idx}.units`] = 'Units must be zero or greater';
    if (Number(row.unitPrice) < 0) errors[`charges.${idx}.unitCharge`] = 'Charge amount must be zero or greater';
    if (row.from && row.to && row.to < row.from) {
      errors[`charges.${idx}.serviceToDate`] = 'To date cannot be before from date';
    }
  });
  return errors;
}
