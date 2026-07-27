import { Plus, FilePlus2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionCard } from '../../components/chart-ui';
import { cn } from '@/lib/utils';

export function IntakeSectionCard({
  title,
  id,
  children,
  onAdd,
  onAddendum,
  showAdd = true,
  showAddendum = false,
  headerExtra,
  accent = 'default',
  className,
}) {
  const actions = (
    <>
      {headerExtra}
      {showAddendum && onAddendum && (
        <Button type="button" variant="outline" size="sm" onClick={onAddendum}>
          <FilePlus2 className="mr-1 h-4 w-4" />
          Add Addendum
        </Button>
      )}
      {showAdd && onAdd && !showAddendum && (
        <Button type="button" variant="outline" size="icon-sm" onClick={onAdd} aria-label={`Add ${title}`}>
          <Plus className="h-4 w-4" />
        </Button>
      )}
    </>
  );

  return (
    <SectionCard
      id={id}
      title={title}
      accent={accent}
      actions={actions}
      className={cn(className)}
      contentClassName="space-y-4"
    >
      {children}
    </SectionCard>
  );
}
