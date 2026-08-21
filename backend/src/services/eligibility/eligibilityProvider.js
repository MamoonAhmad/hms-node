/**
 * Eligibility clearinghouse/payer abstraction.
 * Swap MockEligibilityProvider for a real 270/271 adapter without changing appointment flows.
 */
class MockEligibilityProvider {
  get name() {
    return 'mock-clearinghouse';
  }

  async verify({ patient, insurance, appointment }) {
    const memberId = insurance?.memberId || 'UNKNOWN';
    const payerName = insurance?.insuranceProvider?.name || 'Unknown Payer';
    const covered = Boolean(insurance?.memberId);
    return {
      externalTraceId: `MOCK-${Date.now()}`,
      status: covered ? 'Active' : 'Failed',
      coverageStatus: covered ? 'Active' : 'Inactive',
      payerName,
      memberId,
      groupNumber: insurance?.groupNumber || null,
      subscriberFirstName: insurance?.subscriberFirstName || patient?.firstName || null,
      subscriberLastName: insurance?.subscriberLastName || patient?.lastName || null,
      subscriberRelationship: insurance?.subscriberRelationship || 'self',
      effectiveDate: insurance?.coverageStartDate || null,
      terminationDate: insurance?.coverageEndDate || null,
      copay: insurance?.copay != null ? Number(insurance.copay) : 40,
      coinsurancePercentage:
        insurance?.coinsurancePercentage != null ? Number(insurance.coinsurancePercentage) : 20,
      deductible: insurance?.deductible != null ? Number(insurance.deductible) : 500,
      deductibleRemaining: insurance?.deductible != null ? Number(insurance.deductible) : 350,
      outOfPocketMax: 5000,
      outOfPocketRemaining: 4200,
      referralRequired: false,
      priorAuthRequired: Boolean(appointment?.appointmentTypeRef?.name?.toLowerCase?.().includes('procedure')),
      benefitsSummary: {
        officeVisit: covered ? 'Covered' : 'Not covered',
        specialist: 'Subject to referral',
      },
      requestPayload: {
        transaction: '270',
        memberId,
        payerName,
        appointmentId: appointment?.id || null,
      },
      responsePayload: {
        transaction: '271',
        mock: true,
        covered,
      },
    };
  }
}

let activeProvider = new MockEligibilityProvider();

const eligibilityProviderRegistry = {
  getProvider() {
    return activeProvider;
  },
  setProvider(provider) {
    if (!provider || typeof provider.verify !== 'function') {
      throw new Error('Eligibility provider must implement verify()');
    }
    activeProvider = provider;
  },
  MockEligibilityProvider,
};

module.exports = eligibilityProviderRegistry;
