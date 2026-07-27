import { useEffect, useRef } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

/**
 * Inline accordion panel for intake add/edit forms (replaces Dialog modals).
 * When `open` is false the panel is hidden; clicking section + sets open=true.
 */
export function IntakeInlineFormPanel({
  open,
  onOpenChange,
  title,
  children,
  footer,
  className,
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open || !panelRef.current) return;
    panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [open]);

  if (!open) return null;

  return (
    <div ref={panelRef}>
      <Accordion
        type="single"
        collapsible
        value="form"
        onValueChange={(value) => {
          if (value !== 'form') onOpenChange?.(false);
        }}
        className={cn(
          'rounded-xl border border-border/80 bg-muted/20 shadow-sm',
          className,
        )}
      >
        <AccordionItem value="form" className="border-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <span className="text-sm font-semibold text-primary-foreground">{title}</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">{children}</div>
            {footer ? (
              <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-3">
                {footer}
              </div>
            ) : null}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
