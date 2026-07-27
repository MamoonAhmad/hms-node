import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LockedNoteBanner, ReadOnlyValue, AddendumsList } from './ReadOnlyNoteFields';

function formatVitalsSummary(v) {
  const parts = [];
  if (v.bpSys || v.bpDia) parts.push(`BP ${v.bpSys || '–'}/${v.bpDia || '–'}`);
  if (v.pulse) parts.push(`Pulse ${v.pulse}`);
  if (v.temperature) parts.push(`Temp ${v.temperature}°F`);
  if (v.o2) parts.push(`SpO2 ${v.o2}%`);
  return parts.length ? parts.join(', ') : '—';
}

export function SoapNoteReadOnlyView({ note }) {
  const c = note?.content || {};
  const subjective = c.subjective || {};
  const allergies = note?.allergies || [];
  const vitalsList = note?.vitalsList || [];
  const diagnoses = c.diagnoses || [];
  const medications = c.medications || [];

  return (
    <div className="space-y-6">
      <LockedNoteBanner
        noteTypeLabel="SOAP Note"
        date={note?.date}
        provider={note?.provider}
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Note metadata</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ReadOnlyValue label="Chief complaint" value={c.headerChiefComplaint} className="sm:col-span-2" />
          <ReadOnlyValue label="Date of service" value={note?.date} />
          <ReadOnlyValue label="Provider" value={note?.provider} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">S – Subjective</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <ReadOnlyValue label="Chief complaint (CC)" value={subjective.chiefComplaint} className="sm:col-span-2" />
          <ReadOnlyValue label="History of present illness (HPI)" value={subjective.hpi} className="sm:col-span-2" />
          <ReadOnlyValue label="Review of systems (ROS)" value={subjective.ros} className="sm:col-span-2" />
          <ReadOnlyValue label="Current medications" value={subjective.currentMeds} className="sm:col-span-2" />
          <ReadOnlyValue label="Past medical history" value={subjective.pmh} />
          <ReadOnlyValue label="Past surgical" value={subjective.pastSurgical} />
          <ReadOnlyValue label="Social history" value={subjective.socialHx} />
          <ReadOnlyValue label="Family history" value={subjective.familyHx} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Allergies</CardTitle>
        </CardHeader>
        <CardContent>
          {allergies.length === 0 ? (
            <p className="text-sm text-muted-foreground">No allergies recorded.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Allergen</TableHead>
                  <TableHead>Reaction</TableHead>
                  <TableHead>Severity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allergies.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.allergen || '—'}</TableCell>
                    <TableCell>{item.reaction || '—'}</TableCell>
                    <TableCell>{item.severity || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">O – Objective</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Vital signs
            </p>
            {vitalsList.length === 0 ? (
              <p className="text-sm text-muted-foreground">No vitals recorded.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recorded</TableHead>
                    <TableHead>Summary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vitalsList.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>
                        {v.recordedAt ? new Date(v.recordedAt).toLocaleString() : '—'}
                      </TableCell>
                      <TableCell>{formatVitalsSummary(v)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <ReadOnlyValue label="Physical exam" value={c.physicalExam} />
          <ReadOnlyValue label="Diagnostic testing results" value={c.diagnosticTestingResults} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">A – Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Diagnosis(es)
            </p>
            {diagnoses.some((d) => d.code || d.description) ? (
              <ul className="space-y-1 text-sm">
                {diagnoses
                  .filter((d) => d.code || d.description)
                  .map((d, i) => (
                    <li key={i} className="font-medium">
                      {[d.code, d.description].filter(Boolean).join(' — ')}
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </div>
          <ReadOnlyValue label="Differential" value={c.differential} />
          <ReadOnlyValue label="Clinical impression" value={c.clinicalImpression} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">P – Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ReadOnlyValue label="Plan" value={c.planText} />
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Medications
            </p>
            {medications.some((m) => m.name) ? (
              <ul className="space-y-1 text-sm">
                {medications
                  .filter((m) => m.name)
                  .map((m, i) => (
                    <li key={i} className="font-medium">
                      {[m.name, m.dose, m.frequency, m.duration].filter(Boolean).join(' · ')}
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </div>
          <ReadOnlyValue label="Follow-up" value={c.followUp} />
          <ReadOnlyValue label="Patient education" value={c.patientEducation} />
          <ReadOnlyValue label="Referrals" value={c.referrals} />
        </CardContent>
      </Card>

      <AddendumsList addendums={note?.addendums} />
    </div>
  );
}
