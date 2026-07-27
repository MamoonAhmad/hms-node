import { useEffect, useMemo, useState } from 'react';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, History, Loader2, Pencil } from 'lucide-react';
import { useIntake } from '../IntakeContext';
import { ScreeningHistoryDrawer } from './ScreeningHistoryDrawer';

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Strip the derived `result` back out so the form is re-hydrated with raw answers.
function extractAnswers(record, definition) {
  if (!record || !record.payload) return definition.defaultAnswers();
  const { result, ...rest } = record.payload;
  void result;
  return rest;
}

export function ScreeningAccordionItem({ item }) {
  const { id, icon: Icon, Component, definition } = item;
  const { getRecordsBySection, saveSection, saving } = useIntake();

  const records = getRecordsBySection(definition.sectionType);
  const latest = records[0] || null;
  const completed = Boolean(latest);
  const latestId = latest?.id;

  const [editing, setEditing] = useState(false);
  const [answers, setAnswers] = useState(() => extractAnswers(latest, definition));
  const [showError, setShowError] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Re-hydrate from the newest saved version whenever it changes and we're not
  // actively editing (e.g. after a save reloads the intake bundle).
  useEffect(() => {
    if (!editing) setAnswers(extractAnswers(latest, definition));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestId]);

  const score = useMemo(() => definition.computeScore(answers), [answers, definition]);
  const result = useMemo(() => definition.computeResult(score, answers), [score, answers, definition]);
  const validation = useMemo(() => definition.validate(answers), [answers, definition]);

  const formDisabled = completed && !editing;

  const handleComplete = async () => {
    if (!validation.valid) {
      setShowError(true);
      return;
    }
    setShowError(false);
    await saveSection({
      sectionType: definition.sectionType,
      payload: { ...answers, result },
      score,
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setEditing(false);
    setShowError(false);
    setAnswers(extractAnswers(latest, definition));
  };

  const headerBadge = completed ? (
    <Badge variant="success" className="gap-1">
      <CheckCircle2 className="h-3 w-3" />
      {score}
      {result?.label ? ` · ${result.label}` : ''}
    </Badge>
  ) : (
    <Badge variant="muted">Not started</Badge>
  );

  return (
    <AccordionItem
      id={`screening-${id}`}
      value={id}
      className="scroll-mt-4 rounded-xl border border-border/80 bg-card px-4 shadow-sm"
    >
      <AccordionTrigger className="rounded-t-xl py-4">
        <span className="flex w-full items-center justify-between gap-3 pr-2">
          <span className="flex items-center gap-3 font-semibold text-primary-foreground">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-primary-foreground">
              <Icon className="h-4 w-4" />
            </span>
            {definition.name}
          </span>
          {headerBadge}
        </span>
      </AccordionTrigger>
      <AccordionContent className="pb-5">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0">
            <Component answers={answers} onChange={setAnswers} disabled={formDisabled} />
          </div>

          <div className="lg:sticky lg:top-4 lg:self-start">
            <div className="space-y-4 rounded-xl border border-border/70 bg-muted/30 p-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {definition.scoreLabel || 'Score'}
                </p>
                <p className="mt-1 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground">{score}</span>
                  {definition.maxScore != null && (
                    <span className="text-sm text-muted-foreground">/ {definition.maxScore}</span>
                  )}
                </p>
              </div>

              {result?.label && (
                <div className="space-y-1">
                  <Badge variant={result.variant || 'secondary'}>{result.label}</Badge>
                  {result.interpretation && (
                    <p className="text-xs text-muted-foreground">{result.interpretation}</p>
                  )}
                </div>
              )}

              {completed && !editing && (
                <div className="space-y-1 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1 font-medium text-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Completed
                  </p>
                  <p>{formatDateTime(latest.updatedAt || latest.createdAt)}</p>
                  <p>By {latest.updatedByName || latest.createdByName || '—'}</p>
                  {records.length > 1 && (
                    <p className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {records.length} versions
                    </p>
                  )}
                </div>
              )}

              {showError && !validation.valid && (
                <p className="text-xs font-medium text-destructive">
                  Answer all required questions before completing
                  {validation.missing ? ` (${validation.missing} remaining)` : ''}.
                </p>
              )}

              <div className="flex flex-col gap-2 border-t border-border/60 pt-3">
                {!completed && (
                  <Button type="button" onClick={handleComplete} disabled={saving}>
                    {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                    Complete Screening
                  </Button>
                )}

                {completed && !editing && (
                  <>
                    <Button type="button" onClick={() => setEditing(true)}>
                      <Pencil className="mr-1 h-4 w-4" />
                      Edit Screening
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setHistoryOpen(true)}>
                      <History className="mr-1 h-4 w-4" />
                      View Screening History
                    </Button>
                  </>
                )}

                {completed && editing && (
                  <>
                    <Button type="button" onClick={handleComplete} disabled={saving}>
                      {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                      Save Screening
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </AccordionContent>

      <ScreeningHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        definition={definition}
        records={records}
      />
    </AccordionItem>
  );
}
