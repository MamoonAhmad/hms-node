import { Badge } from '@/components/ui/badge';
import { getWaitlistStatusMeta } from '@/lib/waitlistConstants';

export function WaitlistStatusBadge({ status }) {
  const meta = getWaitlistStatusMeta(status);
  return (
    <Badge
      variant="outline"
      className="border-transparent text-white"
      style={{ backgroundColor: meta.color }}
    >
      {meta.label}
    </Badge>
  );
}

export function WaitlistPriorityBadge({ priority }) {
  const styles = {
    urgent: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    normal: 'bg-slate-100 text-slate-700 border-slate-200',
    low: 'bg-muted text-muted-foreground border-border',
  };
  return (
    <Badge variant="outline" className={styles[priority] || styles.normal}>
      {(priority || 'normal').charAt(0).toUpperCase() + (priority || 'normal').slice(1)}
    </Badge>
  );
}
