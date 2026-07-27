import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CHART_SECTION_GROUPS, CHART_SECTIONS } from '../patientChartConfig';

export function ChartSidebar({ activeSection, onSelect, counts = {}, className }) {
  const groups = useMemo(() => {
    const byGroup = new Map();
    for (const section of CHART_SECTIONS) {
      const key = section.group || 'Other';
      if (!byGroup.has(key)) byGroup.set(key, []);
      byGroup.get(key).push(section);
    }
    const ordered = CHART_SECTION_GROUPS.filter((name) => byGroup.has(name)).map((name) => ({
      group: name,
      items: byGroup.get(name),
    }));
    for (const [name, items] of byGroup) {
      if (!CHART_SECTION_GROUPS.includes(name)) {
        ordered.push({ group: name, items });
      }
    }
    return ordered;
  }, []);

  return (
    <nav aria-label="Patient chart sections" className={cn('flex flex-col gap-5 px-3', className)}>
      {groups.map((group) => (
        <div key={group.group} className="space-y-1.5">
          <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
            {group.group}
          </p>
          <ul className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.id;
              const count = item.countKey ? counts[item.countKey] : undefined;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item.id)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      active
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-foreground/80 hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0',
                        active ? 'text-primary-foreground' : 'text-muted-foreground',
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
                    {count != null && count > 0 && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          'h-5 min-w-5 justify-center px-1.5 text-[11px]',
                          active && 'border-transparent bg-primary-foreground/20 text-primary-foreground',
                        )}
                      >
                        {count}
                      </Badge>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
