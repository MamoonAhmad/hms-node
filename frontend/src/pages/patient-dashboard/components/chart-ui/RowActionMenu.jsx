import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Row action "···" menu that renders its dropdown in a portal anchored to the
 * trigger button. Using a portal prevents the menu from being clipped by
 * ancestors with `overflow-hidden`/`overflow-auto` (e.g. table wrappers).
 *
 * items: Array<{ id, label, icon?, destructive?, hidden? }>
 */
export function RowActionMenu({ items = [], onSelect, disabled, label = 'Row actions', menuWidth = 192 }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const visibleItems = items.filter((item) => !item.hidden);

  const updatePosition = () => {
    const btn = triggerRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));
    setCoords({ top: rect.bottom + 4, left });
  };

  useLayoutEffect(() => {
    if (open) updatePosition();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onScrollOrResize = () => updatePosition();
    const onPointerDown = (e) => {
      if (
        menuRef.current?.contains(e.target) ||
        triggerRef.current?.contains(e.target)
      ) {
        return;
      }
      setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handleSelect = (item) => {
    setOpen(false);
    onSelect?.(item.id, item);
  };

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={disabled}
        className="h-8 w-8"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreVertical className="h-4 w-4" />
      </Button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ position: 'fixed', top: coords.top, left: coords.left, width: menuWidth }}
            className="z-[60] flex flex-col rounded-md border bg-popover p-1 shadow-lg"
          >
            {visibleItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-auto w-full justify-start px-2 py-2',
                    item.destructive && 'text-destructive hover:text-destructive',
                  )}
                  onClick={() => handleSelect(item)}
                >
                  {Icon && <Icon className="mr-2 h-4 w-4" />}
                  {item.label}
                </Button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
