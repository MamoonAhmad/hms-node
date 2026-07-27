import { useCallback, useMemo, useState } from 'react';
import { FlaskConical, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { usePatientChart } from '../PatientChartContext';
import { ChartTabShell } from '../components/chart-ui';
import { HematuriaWorkupForm } from './HematuriaWorkupForm';
import { LutsAuaScoreForm } from './LutsAuaScoreForm';
import { StoneVoidingForm } from './StoneVoidingForm';
import { UROLOGY_SECTIONS } from './urologyConstants';
import {
  auaSeverityLabel,
  computeAuaScore,
  loadUrologyState,
  providerDisplayName,
  saveUrologyState,
} from './urologyUtils';

function todayInputValue() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function PatientUrologyTab() {
  const { patientId, appointmentId, appointment } = usePatientChart();
  const provider = providerDisplayName(appointment);
  return (
    <UrologyTabInner
      key={`${patientId || 'unknown'}::${appointmentId || 'no-appt'}`}
      patientId={patientId}
      appointmentId={appointmentId}
      provider={provider}
    />
  );
}

function UrologyTabInner({ patientId, appointmentId, provider }) {
  const { patient, loading, error, refreshChart } = usePatientChart();

  const defaults = useMemo(
    () => ({
      examinationDate: todayInputValue(),
      provider: provider || '',
    }),
    [provider],
  );

  const initial = loadUrologyState(patientId, appointmentId, defaults);
  if (!initial.lutsAua.provider && provider) initial.lutsAua.provider = provider;
  if (!initial.hematuria.provider && provider) initial.hematuria.provider = provider;
  if (!initial.stoneVoiding.provider && provider) initial.stoneVoiding.provider = provider;

  const [section, setSection] = useState('luts-aua');
  const [state, setState] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(initial.updatedAt);
  const [saveMessage, setSaveMessage] = useState('');

  const persist = useCallback(
    (next) => {
      const saved = saveUrologyState(patientId, appointmentId, next);
      setState(saved);
      setSavedAt(saved.updatedAt);
      setDirty(false);
      setSaveMessage(
        'Saved for this encounter. LUTS / AUA, hematuria, and stone documentation updated for follow-up visits.',
      );
    },
    [patientId, appointmentId],
  );

  const updateLutsAua = (lutsAua) => {
    setState((prev) => ({ ...prev, lutsAua }));
    setDirty(true);
    setSaveMessage('');
  };

  const updateHematuria = (hematuria) => {
    setState((prev) => ({ ...prev, hematuria }));
    setDirty(true);
    setSaveMessage('');
  };

  const updateStoneVoiding = (stoneVoiding) => {
    setState((prev) => ({ ...prev, stoneVoiding }));
    setDirty(true);
    setSaveMessage('');
  };

  const auaScore = computeAuaScore(state.lutsAua?.answers);
  const auaSeverity = auaScore?.complete ? auaSeverityLabel(auaScore.total) : null;

  const subtitle = useMemo(() => {
    const name = [patient?.firstName, patient?.lastName].filter(Boolean).join(' ');
    return name
      ? `LUTS / AUA score, hematuria workup, and stone / voiding symptoms for ${name}.`
      : 'Document LUTS / AUA score, hematuria workup, and stone / voiding symptoms.';
  }, [patient]);

  return (
    <ChartTabShell
      eyebrow="Urology"
      title="Urology"
      description={subtitle}
      loading={loading && !patient}
      error={error}
      onRetry={refreshChart}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {auaScore?.complete && (
            <Badge
              variant="outline"
              className={cn(
                auaSeverity?.tone === 'danger' && 'status-soft-danger',
                auaSeverity?.tone === 'warning' && 'status-soft-warning',
                auaSeverity?.tone === 'success' && 'status-soft-success',
                !auaSeverity && 'status-soft-info',
              )}
            >
              AUA {auaScore.total}
              {auaSeverity ? ` · ${auaSeverity.label}` : ''}
            </Badge>
          )}
          {dirty && (
            <span className="text-xs font-medium text-amber-700">Unsaved changes</span>
          )}
          {!dirty && savedAt && (
            <span className="text-xs text-muted-foreground">
              Saved {new Date(savedAt).toLocaleString()}
            </span>
          )}
          <Button type="button" size="sm" disabled={!dirty} onClick={() => persist(state)}>
            <Save className="mr-1.5 h-3.5 w-3.5" />
            Save
          </Button>
        </div>
      }
    >
      {saveMessage && (
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          {saveMessage}
        </div>
      )}

      <Tabs value={section} onValueChange={setSection} className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-1 gap-1 rounded-xl bg-muted/50 p-1 sm:grid-cols-3">
          {UROLOGY_SECTIONS.map((item) => (
            <TabsTrigger
              key={item.id}
              value={item.id}
              className={cn(
                'rounded-lg data-[state=active]:shadow-sm',
                item.id === 'luts-aua' && 'gap-1.5',
              )}
            >
              {item.id === 'luts-aua' && (
                <FlaskConical className="h-3.5 w-3.5 opacity-80" aria-hidden />
              )}
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="luts-aua" className="mt-6 focus-visible:outline-none">
          <LutsAuaScoreForm value={state.lutsAua} onChange={updateLutsAua} />
        </TabsContent>

        <TabsContent value="hematuria" className="mt-6 focus-visible:outline-none">
          <HematuriaWorkupForm value={state.hematuria} onChange={updateHematuria} />
        </TabsContent>

        <TabsContent value="stone-voiding" className="mt-6 focus-visible:outline-none">
          <StoneVoidingForm value={state.stoneVoiding} onChange={updateStoneVoiding} />
        </TabsContent>
      </Tabs>

      {state.auditLog?.length > 0 && (
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Audit trail
          </p>
          <ul className="mt-2 space-y-1">
            {[...state.auditLog]
              .reverse()
              .slice(0, 5)
              .map((entry) => (
                <li key={`${entry.at}-${entry.note}`} className="text-xs text-muted-foreground">
                  {new Date(entry.at).toLocaleString()} — {entry.note}
                </li>
              ))}
          </ul>
        </div>
      )}
    </ChartTabShell>
  );
}
