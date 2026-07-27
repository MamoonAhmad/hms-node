import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function NoteSignActions({
  confirmChecked,
  onConfirmChange,
  onSaveDraft,
  onSignAndLock,
  onCancelEdit,
  draftLabel = 'Save as draft',
  showCancelEdit = false,
  signDisabledReason,
}) {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <Checkbox
          id="confirm-notes-complete"
          checked={confirmChecked}
          onCheckedChange={(checked) => onConfirmChange?.(!!checked)}
          className="mt-0.5"
        />
        <Label
          htmlFor="confirm-notes-complete"
          className="cursor-pointer text-sm font-normal leading-relaxed text-foreground"
        >
          I hereby confirmed that the patient notes are completed
        </Label>
      </div>
      {!confirmChecked && (
        <p className="text-xs text-muted-foreground">
          {signDisabledReason ||
            'Confirm the checkbox above to enable Sign & lock note.'}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onSaveDraft}>
          {draftLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onSignAndLock}
          disabled={!confirmChecked}
        >
          Sign &amp; lock note
        </Button>
        {showCancelEdit && (
          <Button type="button" variant="ghost" onClick={onCancelEdit}>
            Cancel edit
          </Button>
        )}
      </div>
    </div>
  );
}
