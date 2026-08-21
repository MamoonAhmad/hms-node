import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MENU_Z = 110;
const BACKDROP_Z = 100;

function positionFromTrigger(trigger, menu) {
  const rect = trigger.getBoundingClientRect();
  const menuWidth = menu?.offsetWidth || 0;
  const menuHeight = menu?.offsetHeight || 36;
  const gap = 6;

  let top = rect.top + (rect.height - menuHeight) / 2;
  let left = rect.left - menuWidth - gap;

  if (left < 8) {
    left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));
    top = rect.bottom + gap;
  }

  if (top + menuHeight > window.innerHeight - 8) {
    top = Math.max(8, window.innerHeight - menuHeight - 8);
  }
  if (top < 8) top = 8;
  if (left < 8) left = 8;

  return { top, left };
}

/**
 * Table / toolbar "..." menu. Items render in a horizontal bar, portaled above
 * overflow so the last row and clipped tables still show the full menu.
 */
export function RowActionsMenu({
  children,
  disabled = false,
  trigger,
  triggerClassName,
  align = 'end',
  'aria-label': ariaLabel = 'Actions',
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [ready, setReady] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useLayoutEffect(() => {
    if (!open) {
      setReady(false);
      return undefined;
    }

    const update = () => {
      if (!triggerRef.current || !menuRef.current) return;
      setCoords(positionFromTrigger(triggerRef.current, menuRef.current));
      setReady(true);
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, children]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const triggerButton = (
    <span
      ref={triggerRef}
      className="inline-flex"
      onClick={(event) => {
        event.stopPropagation();
        if (!disabled) setOpen((value) => !value);
      }}
    >
      {trigger || (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', triggerClassName)}
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={ariaLabel}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      )}
    </span>
  );

  return (
    <div className={cn('relative inline-flex', align === 'end' && 'justify-end')}>
      {triggerButton}
      {open &&
        createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 bg-transparent"
              style={{ zIndex: BACKDROP_Z }}
              aria-hidden
              onClick={() => setOpen(false)}
            />
            <div
              ref={menuRef}
              role="menu"
              className={cn(
                'fixed flex max-w-[min(96vw,56rem)] flex-row flex-wrap items-center gap-0.5 rounded-md border bg-popover p-1 shadow-lg',
                !ready && 'opacity-0',
              )}
              style={{
                zIndex: MENU_Z,
                top: coords.top,
                left: coords.left,
              }}
              onClick={() => setOpen(false)}
            >
              {children}
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}

export function RowActionsMenuItem({ className, ...props }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      role="menuitem"
      className={cn('h-8 shrink-0 justify-center whitespace-nowrap px-2.5', className)}
      {...props}
    />
  );
}
