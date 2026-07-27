import { Pencil, FilePen, History, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Standard action buttons for an intake record row.
 * Always shows Edit when an edit/amend handler is available.
 * After certify, Edit opens the amend flow when provided.
 */
export function IntakeRecordActions({
  isCertified,
  onEdit,
  onAmend,
  onHistory,
  onDelete,
  hasHistory = false,
}) {
  const editHandler = !isCertified ? onEdit : (onAmend || onEdit);
  const editLabel = isCertified && onAmend ? 'Amend' : 'Edit';

  return (
    <div className="flex items-center justify-end gap-1">
      {editHandler && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          onClick={editHandler}
          aria-label={editLabel}
        >
          {isCertified && onAmend ? (
            <FilePen className="h-3.5 w-3.5" />
          ) : (
            <Pencil className="h-3.5 w-3.5" />
          )}
          {editLabel}
        </Button>
      )}
      {onHistory && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onHistory}
          aria-label="View history"
          disabled={!hasHistory}
        >
          <History className="h-4 w-4" />
        </Button>
      )}
      {!isCertified && onDelete && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          aria-label="Delete"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
