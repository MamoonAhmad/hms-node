import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Interim mock until vitals/allergy APIs are wired per patient
const mockVitals = [
  {
    id: 1,
    takenBy: 'Nurse Johnson',
    takenAt: '2025-01-15T10:30:00',
    bp: '120/80',
    pulse: 72,
    temperature: '98.6°F',
    weight: '180 lbs',
    height: "5'10\"",
    bloodGroup: 'O+',
    painAssessment: '3/10',
    glucose: '95 mg/dL',
    o2Saturation: '98%',
  },
];

const mockAllergies = [
  {
    id: 1,
    allergyType: 'Drug',
    allergyName: 'Penicillin',
    onsetDate: '2020-01-15',
    severity: 'Severe',
    reaction: 'Rash, Hives',
    status: 'Active',
    takenBy: 'Nurse Johnson',
    takenAt: '2025-01-15T10:30:00',
  },
];

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

export function NurseAssessmentSummaryContent({ patient: _patient }) {
  const assessments = [
    {
      id: 'vitals',
      title: 'Vitals',
      hasData: mockVitals.length > 0,
      summary: mockVitals.length
        ? `BP ${mockVitals[0].bp}, Pulse ${mockVitals[0].pulse}, Temp ${mockVitals[0].temperature}, Weight ${mockVitals[0].weight} — ${formatDateTime(mockVitals[0].takenAt)} (${mockVitals[0].takenBy})`
        : null,
    },
    {
      id: 'allergies',
      title: 'Allergies',
      hasData: mockAllergies.length > 0,
      summary: mockAllergies.length
        ? `${mockAllergies[0].allergyName} (${mockAllergies[0].allergyType}, ${mockAllergies[0].severity}) — ${formatDateTime(mockAllergies[0].takenAt)} (${mockAllergies[0].takenBy})`
        : null,
    },
    {
      id: 'nurse-notes',
      title: 'Nurse Notes',
      hasData: false,
      summary: null,
    },
    {
      id: 'fall-risk',
      title: 'Fall Risk',
      hasData: false,
      summary: null,
    },
    {
      id: 'suicide-rating',
      title: 'Suicide Rating',
      hasData: false,
      summary: null,
    },
    {
      id: 'ros',
      title: 'ROS (Review of Systems)',
      hasData: false,
      summary: null,
    },
    {
      id: 'medical-history',
      title: 'Medical History',
      hasData: false,
      summary: null,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Nurse assessment</CardTitle>
        <p className="text-muted-foreground text-sm font-normal">
          Listing of all assessments and their entered results for this patient.
        </p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {assessments.map((a) => (
            <li key={a.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{a.title}</p>
                  {a.hasData && a.summary ? (
                    <p className="text-muted-foreground text-sm mt-1">{a.summary}</p>
                  ) : (
                    <p className="text-muted-foreground text-sm mt-1 italic">No results entered</p>
                  )}
                </div>
                {a.hasData && (
                  <Badge variant="secondary" className="shrink-0">
                    Recorded
                  </Badge>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
