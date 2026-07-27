import { cn } from '@/lib/utils';
import { ALL_BODY_LOCATIONS, BODY_LOCATION_GROUPS } from './dermatologyConstants';

/** Approximate clickable regions on a simplified anterior body silhouette. */
const MAP_REGIONS = [
  { id: 'Scalp', x: 42, y: 2, w: 16, h: 6 },
  { id: 'Face', x: 44, y: 8, w: 12, h: 8 },
  { id: 'Forehead', x: 44, y: 7, w: 12, h: 3 },
  { id: 'Nose', x: 48, y: 11, w: 4, h: 3 },
  { id: 'Lips', x: 47, y: 14, w: 6, h: 2 },
  { id: 'Chin', x: 47, y: 15.5, w: 6, h: 2 },
  { id: 'Ears', x: 40, y: 10, w: 3, h: 4 },
  { id: 'Neck', x: 46, y: 17, w: 8, h: 4 },
  { id: 'Shoulder', x: 28, y: 22, w: 12, h: 5 },
  { id: 'Chest', x: 40, y: 24, w: 20, h: 10 },
  { id: 'Arm', x: 22, y: 28, w: 8, h: 12 },
  { id: 'Elbow', x: 20, y: 38, w: 8, h: 4 },
  { id: 'Forearm', x: 18, y: 42, w: 8, h: 10 },
  { id: 'Wrist', x: 17, y: 51, w: 7, h: 3 },
  { id: 'Hand', x: 15, y: 54, w: 8, h: 5 },
  { id: 'Fingers', x: 14, y: 58, w: 9, h: 4 },
  { id: 'Abdomen', x: 40, y: 34, w: 20, h: 10 },
  { id: 'Flank', x: 34, y: 32, w: 6, h: 12 },
  { id: 'Upper Back', x: 70, y: 24, w: 18, h: 10 },
  { id: 'Lower Back', x: 70, y: 34, w: 18, h: 8 },
  { id: 'Hip', x: 40, y: 44, w: 20, h: 5 },
  { id: 'Thigh', x: 40, y: 50, w: 9, h: 12 },
  { id: 'Knee', x: 40, y: 62, w: 9, h: 4 },
  { id: 'Leg', x: 40, y: 66, w: 8, h: 12 },
  { id: 'Ankle', x: 40, y: 78, w: 7, h: 3 },
  { id: 'Foot', x: 38, y: 81, w: 10, h: 4 },
  { id: 'Toes', x: 38, y: 85, w: 10, h: 3 },
  { id: 'Genital Area', x: 46, y: 46, w: 8, h: 4 },
];

export function BodyMapSelector({ values = [], onToggle, markers = [] }) {
  const selected = new Set(values);

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <div className="rounded-lg border border-border bg-muted/20 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Body map
        </p>
        <svg viewBox="0 0 100 92" className="mx-auto h-auto w-full max-w-[200px]" role="img" aria-label="Body location map">
          {/* Silhouette hints */}
          <ellipse cx="50" cy="12" rx="8" ry="10" className="fill-muted stroke-border" strokeWidth="0.5" />
          <rect x="42" y="20" width="16" height="26" rx="4" className="fill-muted stroke-border" strokeWidth="0.5" />
          <rect x="28" y="22" width="12" height="28" rx="3" className="fill-muted stroke-border" strokeWidth="0.5" />
          <rect x="60" y="22" width="12" height="28" rx="3" className="fill-muted stroke-border" strokeWidth="0.5" />
          <rect x="42" y="46" width="7" height="34" rx="2" className="fill-muted stroke-border" strokeWidth="0.5" />
          <rect x="51" y="46" width="7" height="34" rx="2" className="fill-muted stroke-border" strokeWidth="0.5" />
          <rect x="70" y="24" width="16" height="22" rx="3" className="fill-muted/60 stroke-border" strokeWidth="0.4" opacity="0.7" />

          {MAP_REGIONS.map((region) => {
            const isOn = selected.has(region.id);
            return (
              <rect
                key={region.id}
                x={region.x}
                y={region.y}
                width={region.w}
                height={region.h}
                rx="1"
                className={cn(
                  'cursor-pointer transition-colors',
                  isOn ? 'fill-primary/50 stroke-primary' : 'fill-transparent stroke-transparent hover:fill-primary/15',
                )}
                strokeWidth="0.6"
                onClick={() => onToggle(region.id)}
              >
                <title>{region.id}</title>
              </rect>
            );
          })}

          {markers.map((m, idx) => {
            const loc = m.locations?.[0];
            const region = MAP_REGIONS.find((r) => r.id === loc);
            if (!region) return null;
            return (
              <circle
                key={m.id || idx}
                cx={region.x + region.w / 2}
                cy={region.y + region.h / 2}
                r="1.8"
                className="fill-destructive stroke-background"
                strokeWidth="0.4"
              >
                <title>{m.label || `Lesion ${idx + 1}`}</title>
              </circle>
            );
          })}
        </svg>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Click regions to select. Markers show documented lesions.
        </p>
      </div>

      <div className="space-y-3">
        {BODY_LOCATION_GROUPS.map((group) => (
          <div key={group.group}>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group.group}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {group.locations.map((loc) => {
                const isOn = selected.has(loc);
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => onToggle(loc)}
                    className={cn(
                      'rounded-md border px-2.5 py-1 text-xs transition-colors',
                      isOn
                        ? 'border-primary/40 bg-primary/10 text-foreground'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted/40',
                    )}
                  >
                    {loc}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {values.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Selected ({values.length}): {values.join(', ')}
            {values.some((v) => !ALL_BODY_LOCATIONS.includes(v)) ? '' : ''}
          </p>
        )}
      </div>
    </div>
  );
}
