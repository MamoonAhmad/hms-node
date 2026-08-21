import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRcmEncounter } from '../RcmEncounterContext';
import { formatDate } from '../rcmEncounterConstants';

function Field({ label, value }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value || '—'}</p>
    </div>
  );
}

export function DemographicsTab() {
  const { encounter } = useRcmEncounter();
  if (!encounter) return null;
  const { patient } = encounter;
  const g = patient.guarantor || {};

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Demographics & guarantor</h2>
        <p className="text-sm text-muted-foreground">Patient billing demographics used on claims.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Patient</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Field label="Name" value={patient.displayName} />
            <Field label="MRN" value={patient.mrn} />
            <Field label="DOB" value={formatDate(patient.dateOfBirth)} />
            <Field label="Gender" value={patient.genderIdentity || patient.gender} />
            <Field label="Phone" value={patient.cellPhone || patient.contactNumber || patient.homePhone} />
            <Field label="Email" value={patient.email} />
            <Field
              label="Address"
              value={[patient.address, patient.addressLine2, patient.city, patient.state, patient.zip]
                .filter(Boolean)
                .join(', ')}
            />
            <Field label="Marital status" value={patient.maritalStatus} />
            <Field label="Employment" value={patient.employmentStatus} />
            <Field label="Employer" value={patient.employerName} />
            <Field label="Billing type" value={patient.billingType} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Guarantor</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Field label="Name" value={g.name} />
            <Field label="Relationship" value={g.relationship} />
            <Field label="Phone" value={g.phone} />
            <Field label="Address" value={g.address} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
