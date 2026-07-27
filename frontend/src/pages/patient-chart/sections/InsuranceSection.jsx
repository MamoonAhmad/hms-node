import { ShieldCheck } from 'lucide-react';
import { ChartTabShell, EmptyState, Field, KeyValueGrid, SectionCard, StatusBadge } from './_shared';
import { formatDate, normalizeInsurances } from '../patientChartHelpers';

export function InsuranceSection({ patient }) {
  const insurances = normalizeInsurances(patient);
  const order = { Primary: 0, Secondary: 1, Tertiary: 2 };
  const sorted = [...insurances].sort((a, b) => (order[a.type] ?? 3) - (order[b.type] ?? 3));

  return (
    <ChartTabShell
      title="Insurance"
      description="Coverage records captured during registration and eligibility checks."
    >
      {sorted.length ? (
        <div className="space-y-4">
          {sorted.map((ins) => (
            <SectionCard
              key={ins.id}
              title={`${ins.type} Insurance`}
              description={ins.payerName}
              icon={ShieldCheck}
              accent={ins.type === 'Primary' ? 'info' : 'default'}
              actions={<StatusBadge status={ins.eligibilityStatus} />}
            >
              <KeyValueGrid columns={3}>
                <Field label="Payer name" value={ins.payerName} />
                <Field label="Plan name" value={ins.planName} />
                <Field label="Member ID" value={ins.memberId} mono />
                <Field label="Group number" value={ins.groupNumber} mono />
                <Field label="Subscriber" value={ins.subscriberName} />
                <Field label="Relationship" value={ins.subscriberRelationship} />
                <Field label="Subscriber DOB" value={ins.subscriberDob ? formatDate(ins.subscriberDob) : '—'} />
                <Field label="Effective date" value={ins.effectiveDate ? formatDate(ins.effectiveDate) : '—'} />
                <Field label="Expiry date" value={ins.expiryDate ? formatDate(ins.expiryDate) : '—'} />
                <Field label="Copay" value={ins.copay != null ? `$${Number(ins.copay).toFixed(2)}` : '—'} />
                <Field label="Deductible" value={ins.deductible != null ? `$${Number(ins.deductible).toFixed(2)}` : '—'} />
                <Field label="Authorization #" value={ins.authorizationNumber} mono />
              </KeyValueGrid>
            </SectionCard>
          ))}
        </div>
      ) : (
        <EmptyState icon={ShieldCheck} title="No insurance on file." description="Self-pay, or insurance has not been captured yet." />
      )}
    </ChartTabShell>
  );
}
