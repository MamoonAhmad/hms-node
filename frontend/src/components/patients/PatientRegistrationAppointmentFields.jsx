import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  REFERRAL_SOURCES,
  OUTPATIENT_PROVIDERS,
  DEPARTMENT_OPTIONS,
} from '@/components/patients/patientRegistrationAppointmentConstants';

/**
 * Outpatient appointment + referral fields (same block as Patient registration → Appointment tab).
 * @param {Object} props
 * @param {Record<string, unknown>} props.formData
 * @param {Record<string, string>} props.errors
 * @param {(field: string, value: unknown) => void} props.onChange
 * @param {string} [props.idPrefix] — prefix for HTML ids when multiple instances could exist
 */
export function PatientRegistrationAppointmentFields({ formData, errors = {}, onChange, idPrefix = '' }) {
  const pid = (name) => (idPrefix ? `${idPrefix}-${name}` : name);

  return (
    <>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Outpatient Appointment</h3>
        <p className="text-sm text-muted-foreground">Capture appointment details for the outpatient clinic visit.</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={pid('appointmentDepartment')}>Department</Label>
            <Select
              value={formData.appointmentDepartment || ''}
              onValueChange={(value) => onChange('appointmentDepartment', value)}
            >
              <SelectTrigger
                id={pid('appointmentDepartment')}
                className={`w-full ${errors.appointmentDepartment ? 'border-destructive' : ''}`}
              >
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENT_OPTIONS.map((dept) => (
                  <SelectItem key={dept.value} value={dept.value}>
                    {dept.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.appointmentDepartment && (
              <p className="text-xs text-destructive">{errors.appointmentDepartment}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor={pid('appointmentProvider')}>Provider</Label>
            <Select
              value={formData.appointmentProvider || ''}
              onValueChange={(value) => onChange('appointmentProvider', value)}
            >
              <SelectTrigger id={pid('appointmentProvider')} className="w-full">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {OUTPATIENT_PROVIDERS.map((p) => (
                  <SelectItem key={p.id} value={p.name}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor={pid('appointmentDate')}>Appointment Date</Label>
            <Input
              id={pid('appointmentDate')}
              type="date"
              value={formData.appointmentDate ?? ''}
              onChange={(e) => onChange('appointmentDate', e.target.value)}
              className={errors.appointmentDate ? 'border-destructive' : ''}
            />
            {errors.appointmentDate && (
              <p className="text-xs text-destructive">{errors.appointmentDate}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor={pid('appointmentVisitType')}>Appointment Type</Label>
            <Select
              value={formData.appointmentVisitType || ''}
              onValueChange={(value) => onChange('appointmentVisitType', value)}
            >
              <SelectTrigger
                id={pid('appointmentVisitType')}
                className={`w-full ${errors.appointmentVisitType ? 'border-destructive' : ''}`}
              >
                <SelectValue placeholder="Select appointment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new-patient">New Patient</SelectItem>
                <SelectItem value="follow-up">Follow-up</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="telehealth">Telehealth</SelectItem>
                <SelectItem value="procedure">Procedure</SelectItem>
              </SelectContent>
            </Select>
            {errors.appointmentVisitType && (
              <p className="text-xs text-destructive">{errors.appointmentVisitType}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor={pid('appointmentTime')}>Appointment Time</Label>
            <Input
              id={pid('appointmentTime')}
              type="time"
              value={formData.appointmentTime ?? ''}
              onChange={(e) => onChange('appointmentTime', e.target.value)}
              className={errors.appointmentTime ? 'border-destructive' : ''}
            />
            {errors.appointmentTime && (
              <p className="text-xs text-destructive">{errors.appointmentTime}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={pid('appointmentReason')}>Reason for Visit</Label>
          <Input
            id={pid('appointmentReason')}
            value={formData.appointmentReason ?? ''}
            onChange={(e) => onChange('appointmentReason', e.target.value)}
            placeholder="e.g., Annual physical, cough, follow-up labs"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={pid('appointmentNotes')}>Appointment Notes</Label>
          <Textarea
            id={pid('appointmentNotes')}
            value={formData.appointmentNotes ?? ''}
            onChange={(e) => onChange('appointmentNotes', e.target.value)}
            rows={4}
            placeholder="Any special instructions, symptoms, or scheduling notes"
          />
        </div>

        <div className="space-y-4 border-t pt-6">
          <div className="space-y-2">
            <Label htmlFor={pid('referredBy')}>Referred By</Label>
            <p className="text-xs text-muted-foreground" id={pid('referredBy-hint')}>
              Source of referral (optional)
            </p>
            <Select
              value={
                formData.referredBy && REFERRAL_SOURCES.some((o) => o.value === formData.referredBy)
                  ? formData.referredBy
                  : 'none'
              }
              onValueChange={(value) => onChange('referredBy', value === 'none' ? '' : value)}
            >
              <SelectTrigger
                id={pid('referredBy')}
                className="w-full max-w-md"
                aria-describedby={pid('referredBy-hint')}
              >
                <SelectValue placeholder="Select source of referral" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None selected</SelectItem>
                {REFERRAL_SOURCES.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.referredBy && !REFERRAL_SOURCES.some((o) => o.value === formData.referredBy) && (
              <p className="text-xs text-muted-foreground">
                Legacy free-text value on file:{' '}
                <span className="font-medium text-foreground">{formData.referredBy}</span>. Pick a standard option
                above to replace it on save.
              </p>
            )}
          </div>

          <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
            <h4 className="text-sm font-semibold text-foreground">Referring physician information</h4>
            <p className="text-xs text-muted-foreground">
              All fields below are optional. Use for billing or care coordination when a referring provider applies.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={pid('referringPhysicianFirstName')}>Referring physician first name</Label>
                <Input
                  id={pid('referringPhysicianFirstName')}
                  value={formData.referringPhysicianFirstName ?? ''}
                  onChange={(e) => onChange('referringPhysicianFirstName', e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={pid('referringPhysicianLastName')}>Referring physician last name</Label>
                <Input
                  id={pid('referringPhysicianLastName')}
                  value={formData.referringPhysicianLastName ?? ''}
                  onChange={(e) => onChange('referringPhysicianLastName', e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor={pid('referringPhysicianNpi')}>NPI</Label>
                <Input
                  id={pid('referringPhysicianNpi')}
                  value={formData.referringPhysicianNpi ?? ''}
                  onChange={(e) => onChange('referringPhysicianNpi', e.target.value)}
                  placeholder="10-digit NPI"
                  inputMode="numeric"
                  maxLength={20}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={pid('referringPhysicianPhone')}>Phone</Label>
                <Input
                  id={pid('referringPhysicianPhone')}
                  value={formData.referringPhysicianPhone ?? ''}
                  onChange={(e) => onChange('referringPhysicianPhone', e.target.value)}
                  className={errors.referringPhysicianPhone ? 'border-destructive' : ''}
                  placeholder="Phone"
                />
                {errors.referringPhysicianPhone && (
                  <p className="text-xs text-destructive">{errors.referringPhysicianPhone}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor={pid('referringPhysicianFax')}>Fax</Label>
                <Input
                  id={pid('referringPhysicianFax')}
                  value={formData.referringPhysicianFax ?? ''}
                  onChange={(e) => onChange('referringPhysicianFax', e.target.value)}
                  className={errors.referringPhysicianFax ? 'border-destructive' : ''}
                  placeholder="Fax"
                />
                {errors.referringPhysicianFax && (
                  <p className="text-xs text-destructive">{errors.referringPhysicianFax}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={pid('referringPhysicianAddress')}>Street address</Label>
              <Input
                id={pid('referringPhysicianAddress')}
                value={formData.referringPhysicianAddress ?? ''}
                onChange={(e) => onChange('referringPhysicianAddress', e.target.value)}
                placeholder="Address"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor={pid('referringPhysicianCity')}>City</Label>
                <Input
                  id={pid('referringPhysicianCity')}
                  value={formData.referringPhysicianCity ?? ''}
                  onChange={(e) => onChange('referringPhysicianCity', e.target.value)}
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={pid('referringPhysicianState')}>State</Label>
                <Input
                  id={pid('referringPhysicianState')}
                  value={formData.referringPhysicianState ?? ''}
                  onChange={(e) => onChange('referringPhysicianState', e.target.value)}
                  placeholder="State"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={pid('referringPhysicianZip')}>ZIP</Label>
                <Input
                  id={pid('referringPhysicianZip')}
                  value={formData.referringPhysicianZip ?? ''}
                  onChange={(e) => onChange('referringPhysicianZip', e.target.value)}
                  placeholder="ZIP"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
