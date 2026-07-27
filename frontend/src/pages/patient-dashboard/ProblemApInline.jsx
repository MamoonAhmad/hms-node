import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function ProblemApInline({
  assessment = '',
  plan = '',
  disabled,
  onSave,
  defaultOpen = false,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [localAssessment, setLocalAssessment] = useState(assessment || '');
  const [localPlan, setLocalPlan] = useState(plan || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalAssessment(assessment || '');
    setLocalPlan(plan || '');
  }, [assessment, plan]);

  const dirty =
    (localAssessment || '') !== (assessment || '') || (localPlan || '') !== (plan || '');

  const handleSave = async () => {
    if (!onSave || !dirty) return;
    setSaving(true);
    try {
      await onSave({
        assessment: localAssessment.trim() || null,
        plan: localPlan.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  };

  const hasContent = Boolean((assessment || '').trim() || (plan || '').trim());

  return (
    <div className="rounded-md border border-border/80 bg-muted/20">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-muted/40"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        Assessment &amp; Plan
        {hasContent && !open && (
          <span className="ml-1 truncate text-xs font-normal text-muted-foreground">
            {[assessment, plan].filter(Boolean).join(' · ')}
          </span>
        )}
      </button>
      {open && (
        <div className="space-y-3 border-t border-border/80 px-3 py-3">
          <div className="space-y-1.5">
            <Label htmlFor={`ap-assessment-${assessment?.slice?.(0, 4) || 'new'}`} className="text-xs">
              Assessment
            </Label>
            <Textarea
              value={localAssessment}
              onChange={(e) => setLocalAssessment(e.target.value)}
              placeholder="Clinical assessment for this visit…"
              rows={2}
              disabled={disabled || saving}
              maxLength={5000}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Plan</Label>
            <Textarea
              value={localPlan}
              onChange={(e) => setLocalPlan(e.target.value)}
              placeholder="Plan / follow-up for this visit…"
              rows={2}
              disabled={disabled || saving}
              maxLength={5000}
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={disabled || saving || !dirty}
            >
              {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Save A/P
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
