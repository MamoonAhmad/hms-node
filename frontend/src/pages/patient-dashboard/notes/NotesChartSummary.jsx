import { useState } from 'react';
import { Eye, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatNoteDate, formatShortDate, NOTE_TYPE_LABELS } from './noteConstants';

function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="shadow-sm">
      <CardHeader className="cursor-pointer py-3" onClick={() => setOpen((o) => !o)}>
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {title}
        </CardTitle>
      </CardHeader>
      {open && <CardContent className="space-y-2 pt-0 text-sm">{children}</CardContent>}
    </Card>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <p className="text-sm">{value ?? '—'}</p>
    </div>
  );
}

export function NotesChartSummary({
  context,
  onViewNote,
  onViewAllEncounters,
  loading,
}) {
  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading chart summary…</p>;
  }
  if (!context) {
    return <p className="text-sm text-muted-foreground">Chart summary unavailable.</p>;
  }

  const {
    demographics,
    encounter,
    coverage,
    activeProblems,
    pastMedicalHistory,
    pastSurgicalHistory,
    allergies,
    nkda,
    currentMedications,
    recentVitals,
    familyHistory,
    socialHistory,
    recentAcuteCare,
    screenings,
    recentResults,
    intakeSignOff,
    priorNotes,
  } = context;

  return (
    <div className="space-y-3">
      <Section title="Prior Notes (this encounter)" defaultOpen>
        {priorNotes?.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {priorNotes.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="text-xs">{NOTE_TYPE_LABELS[n.noteType] || n.noteType}</TableCell>
                  <TableCell className="text-xs">{n.author}</TableCell>
                  <TableCell>
                    <Badge variant={n.signatureStatus === 'Signed' ? 'default' : 'secondary'} className="text-xs">
                      {n.signatureStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => onViewNote?.(n.id)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground">No notes for this encounter yet.</p>
        )}
        <Button type="button" variant="outline" size="sm" className="mt-2 w-full" onClick={onViewAllEncounters}>
          View Notes From All Encounters
        </Button>
      </Section>

      <Section title="Patient Demographics" defaultOpen>
        <Field label="Name" value={demographics?.name} />
        <Field label="MRN" value={demographics?.mrn} />
        <Field label="DOB" value={demographics?.dob} />
        <Field label="Age" value={demographics?.age} />
        <Field label="Sex" value={demographics?.sex} />
      </Section>

      <Section title="Current Encounter Context" defaultOpen>
        <Field label="Visit Type" value={encounter?.visitType} />
        <Field label="Status" value={encounter?.status} />
        <Field label="Provider" value={encounter?.provider} />
        <Field label="Location" value={encounter?.location} />
        <Field label="Encounter Time" value={encounter?.encounterDateTime} />
        <Field label="Chief Complaint" value={encounter?.chiefComplaint} />
      </Section>

      <Section title="Coverage & Coordination">
        <Field label="Primary Payer" value={coverage?.primaryPayer} />
        <Field label="Eligibility" value={coverage?.eligibility} />
        <Field label="Copay Due" value={coverage?.copay?.amountDue != null ? `$${coverage.copay.amountDue}` : '—'} />
      </Section>

      <Section title="Active Problems">
        {activeProblems?.length ? (
          <ul className="space-y-1">
            {activeProblems.map((p, i) => (
              <li key={i} className="rounded border px-2 py-1">
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.icd10Code} · {p.status}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No active problems.</p>
        )}
      </Section>

      <Section title="Medical History">
        <p className="text-xs font-semibold text-muted-foreground">Past Medical History</p>
        {pastMedicalHistory?.length ? (
          pastMedicalHistory.map((r, i) => (
            <p key={i}>{r.condition} — {r.status}</p>
          ))
        ) : (
          <p className="text-muted-foreground">No data available.</p>
        )}
        <p className="mt-2 text-xs font-semibold text-muted-foreground">Past Surgical History</p>
        {pastSurgicalHistory?.length ? (
          pastSurgicalHistory.map((r, i) => (
            <p key={i}>{r.procedureName} — {r.procedureDate}</p>
          ))
        ) : (
          <p className="text-muted-foreground">No data available.</p>
        )}
      </Section>

      <Section title="Allergies">
        {nkda ? (
          <p>NKDA</p>
        ) : allergies?.length ? (
          allergies.map((a, i) => (
            <p key={i}>{a.allergen} — {a.severity} — {a.reaction}</p>
          ))
        ) : (
          <p className="text-muted-foreground">No data available.</p>
        )}
      </Section>

      <Section title="Current Medications">
        {currentMedications?.length ? (
          currentMedications.map((m, i) => (
            <p key={i}>{m.name} · {m.route} · {m.frequency}</p>
          ))
        ) : (
          <p className="text-muted-foreground">No data available.</p>
        )}
      </Section>

      <Section title="Recent Vitals">
        {recentVitals?.length ? (
          recentVitals.slice(0, 3).map((v, i) => (
            <div key={i} className="rounded border px-2 py-1 text-xs">
              <p>{formatShortDate(v.recordedAt)}</p>
              <p>BP {v.bloodPressure || '—'} · Pulse {v.pulse || '—'} · Temp {v.temperature || '—'}</p>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground">No data available.</p>
        )}
      </Section>

      <Section title="Family History">
        {familyHistory?.length ? (
          familyHistory.map((f, i) => <p key={i}>{f.relationship}: {f.condition}</p>)
        ) : (
          <p className="text-muted-foreground">No family history documented.</p>
        )}
      </Section>

      <Section title="Social History">
        {socialHistory ? (
          <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(socialHistory, null, 2)}</pre>
        ) : (
          <p className="text-muted-foreground">No social history documented.</p>
        )}
      </Section>

      <Section title="Recent Acute Care">
        {recentAcuteCare?.length ? (
          recentAcuteCare.map((v, i) => (
            <p key={i}>{v.visitType} — {v.facilityName} — {v.admissionDate}</p>
          ))
        ) : (
          <p className="text-muted-foreground">No recent acute care documented.</p>
        )}
      </Section>

      <Section title="Screenings">
        {screenings?.length ? (
          screenings.map((s, i) => (
            <p key={i}>{s.type}: {s.score ?? '—'}/{s.maxScore ?? '—'}</p>
          ))
        ) : (
          <p className="text-muted-foreground">No screenings documented.</p>
        )}
      </Section>

      <Section title="Recent Labs & Results">
        {recentResults?.length ? (
          recentResults.map((r, i) => (
            <p key={i}>{r.name} — {r.value} — {formatShortDate(r.date)}</p>
          ))
        ) : (
          <p className="text-muted-foreground">No recent results.</p>
        )}
      </Section>

      <Section title="Intake Sign Off">
        <Field label="Intake Status" value={intakeSignOff?.status} />
        <Field label="Signed By" value={intakeSignOff?.signedBy} />
        <Field label="Signature Date" value={formatNoteDate(intakeSignOff?.signedAt)} />
        {intakeSignOff?.certification && (
          <p className="text-xs italic text-muted-foreground">{intakeSignOff.certification}</p>
        )}
      </Section>
    </div>
  );
}
