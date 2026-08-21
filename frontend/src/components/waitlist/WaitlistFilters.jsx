import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WAITLIST_PRIORITIES, WAITLIST_STATUSES } from '@/lib/waitlistConstants';

export function WaitlistFilters({
  filters,
  onChange,
  providers = [],
  departments = [],
  appointmentTypes = [],
}) {
  const setField = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        <div className="space-y-1.5">
          <Label>Search</Label>
          <Input
            placeholder="Patient, MRN, reason…"
            value={filters.search || ''}
            onChange={(e) => setField('search', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            value={filters.status || 'all'}
            onValueChange={(v) => setField('status', v === 'all' ? '' : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active (Waiting + Offered)</SelectItem>
              {WAITLIST_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select
            value={filters.priority || 'all'}
            onValueChange={(v) => setField('priority', v === 'all' ? '' : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {WAITLIST_PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Provider</Label>
          <Select
            value={filters.preferredProviderId || 'all'}
            onValueChange={(v) => setField('preferredProviderId', v === 'all' ? '' : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Any provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any provider</SelectItem>
              {providers.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Department</Label>
          <Select
            value={filters.preferredDepartmentId || 'all'}
            onValueChange={(v) => setField('preferredDepartmentId', v === 'all' ? '' : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Any department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any department</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.departmentName || d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Appointment type</Label>
          <Select
            value={filters.appointmentTypeId || 'all'}
            onValueChange={(v) => setField('appointmentTypeId', v === 'all' ? '' : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Any type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any type</SelectItem>
              {appointmentTypes.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
