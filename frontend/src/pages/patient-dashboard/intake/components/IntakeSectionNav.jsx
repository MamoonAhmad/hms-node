import { useEffect, useMemo, useState } from 'react';
import { List } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { getIntakeNavItems } from '../intakeSectionNavConfig';
import { useIntake } from '../IntakeContext';

function findScrollRoot(el) {
  let node = el?.parentElement;
  while (node && node !== document.body) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === 'auto' || overflowY === 'scroll') return node;
    node = node.parentElement;
  }
  return null;
}

/** Compact jump control for small screens (content area). */
export function IntakeSectionJumpSelect({ mode = 'nurse-assessment', className }) {
  const { patient } = useIntake();
  const items = useMemo(() => getIntakeNavItems(mode, patient), [mode, patient]);
  const [activeId, setActiveId] = useState(items[0]?.id || '');

  useEffect(() => {
    setActiveId(items[0]?.id || '');
  }, [mode, items]);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    setActiveId(id);
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!items.length) return null;

  return (
    <div className={cn('lg:hidden', className)}>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <List className="h-3.5 w-3.5" aria-hidden />
        Jump to section
      </label>
      <Select value={activeId} onValueChange={scrollToSection}>
        <SelectTrigger className="h-9 bg-card">
          <SelectValue placeholder="Choose section" />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Fixed left side menu — does not scroll with intake content. */
export function IntakeSectionNav({ mode = 'nurse-assessment', className }) {
  const { patient } = useIntake();
  const items = useMemo(() => getIntakeNavItems(mode, patient), [mode, patient]);
  const itemKey = items.map((i) => i.id).join('|');
  const [activeId, setActiveId] = useState(items[0]?.id || '');

  useEffect(() => {
    setActiveId(items[0]?.id || '');
  }, [itemKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!items.length) return undefined;

    let observer;
    const timer = requestAnimationFrame(() => {
      const elements = items
        .map((item) => document.getElementById(item.id))
        .filter(Boolean);

      if (!elements.length) return;

      const root = findScrollRoot(elements[0]);
      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          if (visible[0]?.target?.id) {
            setActiveId(visible[0].target.id);
          }
        },
        {
          root,
          rootMargin: '-10% 0px -70% 0px',
          threshold: [0, 0.1, 0.25, 0.5],
        },
      );

      elements.forEach((el) => observer.observe(el));
    });

    return () => {
      cancelAnimationFrame(timer);
      observer?.disconnect();
    };
  }, [itemKey, items]);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    setActiveId(id);
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!items.length) return null;

  return (
    <aside
      className={cn(
        'hidden h-full min-h-0 w-56 shrink-0 flex-col self-stretch border-r border-border bg-card lg:flex xl:w-60',
        className,
      )}
      aria-label="Intake sections"
    >
      <div className="shrink-0 border-b border-border/80 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          On this page
        </p>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const active = activeId === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  aria-current={active ? 'true' : undefined}
                  className={cn(
                    'flex w-full items-center rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    active
                      ? 'bg-primary font-medium text-primary-foreground shadow-sm'
                      : 'text-foreground/80 hover:bg-muted hover:text-foreground',
                  )}
                >
                  <span className="truncate">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
