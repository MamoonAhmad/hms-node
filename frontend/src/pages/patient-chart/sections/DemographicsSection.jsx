import { Link } from 'react-router-dom';
import { Briefcase, Contact as ContactIcon, IdCard, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChartTabShell, Field, KeyValueGrid, SectionCard } from './_shared';
import { calcAge, formatDate, patientStatusLabel } from '../patientChartHelpers';

function maskSsn(ssn, canView) {
  if (!ssn) return '—';
  if (canView) return ssn;
  const s = String(ssn);
  return `•••-••-${s.slice(-4)}`;
}

export function DemographicsSection({ patient, permissions }) {
  const age = calcAge(patient.dateOfBirth);
  return (
    <ChartTabShell
      title="Demographics"
      description="Complete demographic record. Updates are recorded in the audit history."
      actions={
        patient?.id ? (
          <Button variant="outline" size="sm" asChild>
            <Link to={`/patients/edit/${patient.id}`}>Edit Demographics</Link>
          </Button>
        ) : null
      }
    >
      <div className="space-y-6">
        <SectionCard title="Personal Information" icon={IdCard} accent="primary">
          <KeyValueGrid columns={3}>
            <Field label="First name" value={patient.firstName} />
            <Field label="Middle name" value={patient.middleName} />
            <Field label="Last name" value={patient.lastName} />
            <Field label="Preferred name" value={patient.preferredName} />
            <Field label="Previous name" value={patient.previousName} />
            <Field label="Date of birth" value={formatDate(patient.dateOfBirth)} />
            <Field label="Age" value={age != null ? `${age}` : '—'} />
            <Field label="Legal sex" value={patient.gender || patient.legalSex} />
            <Field label="Gender identity" value={patient.genderIdentity} />
            <Field label="Pronouns" value={patient.pronouns} />
            <Field label="Marital status" value={patient.maritalStatus} />
            <Field label="Race" value={patient.race} />
            <Field label="Ethnicity" value={patient.ethnicity} />
            <Field label="Preferred language" value={patient.preferredLanguage} />
            <Field label="Interpreter required" value={patient.interpreterRequired ? 'Yes' : 'No'} />
            <Field label="SSN" value={maskSsn(patient.ssn || patient.socialSecurityNumber, permissions?.isAdmin)} mono />
            <Field label="Patient status" value={patientStatusLabel(patient)} />
          </KeyValueGrid>
        </SectionCard>

        <SectionCard title="Contact Information" icon={ContactIcon} accent="info">
          <KeyValueGrid columns={3}>
            <Field label="Cell phone" value={patient.cellPhone} />
            <Field label="Home phone" value={patient.homePhone} />
            <Field label="Work phone" value={patient.workPhone} />
            <Field label="Email" value={patient.noEmail ? 'No email on file' : patient.email} />
            <Field label="Preferred contact" value={patient.preferredContactMethod} />
            <Field label="Best time to contact" value={patient.bestTimeToContact} />
          </KeyValueGrid>
        </SectionCard>

        <SectionCard title="Address" icon={MapPin}>
          <KeyValueGrid columns={3}>
            <Field label="Address line 1" value={patient.address} className="sm:col-span-2" />
            <Field label="Address line 2" value={patient.addressLine2} />
            <Field label="City" value={patient.city} />
            <Field label="State" value={patient.state} />
            <Field label="ZIP code" value={patient.zip} />
            <Field label="Country" value={patient.country} />
          </KeyValueGrid>
        </SectionCard>

        <SectionCard title="Employer Information" icon={Briefcase}>
          <KeyValueGrid columns={2}>
            <Field label="Employer name" value={patient.employerName} />
            <Field label="Occupation" value={patient.occupation} />
            <Field label="Employer phone" value={patient.employerPhone} />
            <Field label="Employer address" value={patient.employerAddress} />
          </KeyValueGrid>
        </SectionCard>
      </div>
    </ChartTabShell>
  );
}
