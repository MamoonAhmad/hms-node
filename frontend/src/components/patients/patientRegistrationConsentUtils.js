import { CONSENT_LIST_TABS } from '@/pages/administration/consent-forms/consentFormsConstants';
import { consentFormApi } from '@/services/api';

export function areMandatoryConsentsSigned(consentForms, consentSignatures) {
  const mandatoryForms = (consentForms || []).filter((form) => form.isMandatory);
  if (!mandatoryForms.length) return true;
  return mandatoryForms.every((form) => !!consentSignatures?.[form.id]?.signedAt);
}

export function hasRegistrationBillingChoice(formData, insuranceList) {
  const billingType = formData?.insuranceBillingType || formData?.billingType;
  if (billingType === 'self-pay' || billingType === 'self_pay') return true;
  if (billingType !== 'insurance') return false;

  return (insuranceList || []).some(
    (item) => item?.insuranceProviderId && (item?.memberId || item?.policyNumber),
  );
}

export function deriveRegistrationStatusPreview(formData) {
  if (formData?.registrationStatus === 'draft') return 'draft';
  if (formData?.registrationStatus === 'completed') return 'completed';
  // Incomplete required items (consents, billing, etc.) stay Pending until finalized.
  return 'pending';
}

export async function fetchActiveConsentForms() {
  const response = await consentFormApi.getAll({
    tab: CONSENT_LIST_TABS.ACTIVE,
    limit: 100,
    page: 1,
  });
  return response.data || [];
}

export function mapPatientConsentSignaturesToState(signatures, { fallbackSigner = 'Patient' } = {}) {
  if (!Array.isArray(signatures) || !signatures.length) return {};

  return signatures.reduce((acc, signature) => {
    if (!signature?.consentFormId) return acc;
    acc[signature.consentFormId] = {
      mode: signature.signatureType === 'drawn' ? 'draw' : 'type',
      value: signature.signatureData || '',
      signedBy: fallbackSigner,
      signedAt: signature.signedAt,
    };
    return acc;
  }, {});
}
