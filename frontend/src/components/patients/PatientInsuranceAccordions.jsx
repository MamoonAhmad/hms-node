import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { PatientInsuranceEntryForm } from '@/components/patients/PatientInsuranceEntryForm';
import {
  INSURANCE_RANK_ORDER,
  INSURANCE_TYPE_LABELS,
} from '@/components/patients/patientRegistrationInsuranceConstants';

const ACCORDION_META = {
  primary: {
    title: 'Primary insurance',
    description: 'Main coverage used first for claims',
  },
  secondary: {
    title: 'Secondary insurance',
    description: 'Optional additional coverage',
  },
  tertiary: {
    title: 'Tertiary insurance',
    description: 'Optional third payer',
  },
};

export function PatientInsuranceAccordions({
  insuranceForms,
  onEntryChange,
  onEntryChangeMany,
  patientDemographics,
  insuranceProviders,
  loadingProviders,
  errors,
  disabled = false,
  onUploadDocuments,
}) {
  const [openItems, setOpenItems] = useState(['primary']);

  return (
    <Accordion
      type="multiple"
      value={openItems}
      onValueChange={setOpenItems}
      className="w-full space-y-3"
    >
      {INSURANCE_RANK_ORDER.map((typeKey) => {
        const meta = ACCORDION_META[typeKey];
        const entry = insuranceForms[typeKey];
        const payerHint = entry?.insuranceCompany
          ? INSURANCE_TYPE_LABELS[typeKey]
          : 'Not filled yet';

        return (
          <AccordionItem
            key={typeKey}
            value={typeKey}
            className="overflow-hidden rounded-xl border border-border/80 border-b-0 bg-card shadow-sm"
          >
            <AccordionTrigger className="rounded-t-xl px-3 py-2.5 sm:px-4 data-[state=open]:border-b data-[state=open]:border-white/20">
              <div className="min-w-0 text-left">
                <p className="text-sm font-semibold text-primary-foreground">{meta.title}</p>
                <p className="mt-0.5 text-xs text-primary-foreground/80">
                  {meta.description}
                  {entry?.planName || entry?.policyNumber
                    ? ` · ${entry.planName || entry.policyNumber}`
                    : ` · ${payerHint}`}
                </p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-5 sm:px-5">
              <PatientInsuranceEntryForm
                insuranceTypeKey={typeKey}
                value={entry}
                onChange={(field, value) => onEntryChange(typeKey, field, value)}
                onChangeMany={(patch) => onEntryChangeMany(typeKey, patch)}
                patientDemographics={patientDemographics}
                insuranceProviders={insuranceProviders}
                loadingProviders={loadingProviders}
                idPrefix={typeKey}
                errors={typeKey === 'primary' ? errors : {}}
                disabled={disabled}
                onUploadDocuments={onUploadDocuments}
              />
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
