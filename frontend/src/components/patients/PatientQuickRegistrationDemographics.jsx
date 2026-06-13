import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PhoneNumberInput } from '@/components/ui/phone-number-input';
import { GENDER_OPTIONS } from '@/components/patients/patientDemographicsConstants';

function RequiredFieldLabel({ htmlFor, children }) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      <span className="text-destructive ml-0.5" aria-hidden="true">
        *
      </span>
    </Label>
  );
}

export function PatientQuickRegistrationDemographics({
  formData,
  errors,
  isLoading,
  onChange,
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Patient demographics</h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <RequiredFieldLabel htmlFor="quick-firstName">First Name</RequiredFieldLabel>
          <Input
            id="quick-firstName"
            value={formData.firstName}
            onChange={(e) => onChange('firstName', e.target.value)}
            disabled={isLoading}
            className={errors.firstName ? 'border-destructive' : ''}
          />
          {errors.firstName && (
            <p className="text-xs text-destructive">{errors.firstName}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="quick-middleName">Middle Name</Label>
          <Input
            id="quick-middleName"
            value={formData.middleName}
            onChange={(e) => onChange('middleName', e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <RequiredFieldLabel htmlFor="quick-lastName">Last Name</RequiredFieldLabel>
          <Input
            id="quick-lastName"
            value={formData.lastName}
            onChange={(e) => onChange('lastName', e.target.value)}
            disabled={isLoading}
            className={errors.lastName ? 'border-destructive' : ''}
          />
          {errors.lastName && (
            <p className="text-xs text-destructive">{errors.lastName}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <RequiredFieldLabel htmlFor="quick-dateOfBirth">Date of Birth</RequiredFieldLabel>
          <Input
            id="quick-dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => onChange('dateOfBirth', e.target.value)}
            disabled={isLoading}
            className={errors.dateOfBirth ? 'border-destructive' : ''}
          />
          {errors.dateOfBirth && (
            <p className="text-xs text-destructive">{errors.dateOfBirth}</p>
          )}
        </div>
        <div className="space-y-2">
          <RequiredFieldLabel htmlFor="quick-gender">Gender</RequiredFieldLabel>
          <Select
            value={formData.gender || ''}
            onValueChange={(value) => onChange('gender', value)}
            disabled={isLoading}
          >
            <SelectTrigger
              id="quick-gender"
              className={`w-full ${errors.gender ? 'border-destructive' : ''}`}
            >
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              {GENDER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.gender && (
            <p className="text-xs text-destructive">{errors.gender}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="quick-email">Email</Label>
          <Input
            id="quick-email"
            type="email"
            value={formData.email}
            onChange={(e) => onChange('email', e.target.value)}
            disabled={isLoading}
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
      </div>

      <div className="space-y-2 max-w-md">
        <RequiredFieldLabel htmlFor="quick-cellPhone">Phone Number</RequiredFieldLabel>
        <PhoneNumberInput
          id="quick-cellPhone"
          value={formData.cellPhone}
          onChange={(value) => onChange('cellPhone', value)}
          disabled={isLoading}
          error={errors.cellPhone}
          aria-invalid={!!errors.cellPhone}
        />
        {errors.cellPhone && (
          <p className="text-xs text-destructive">{errors.cellPhone}</p>
        )}
      </div>

      <div className="space-y-2">
        <RequiredFieldLabel htmlFor="quick-address">Address</RequiredFieldLabel>
        <Input
          id="quick-address"
          value={formData.address}
          onChange={(e) => onChange('address', e.target.value)}
          disabled={isLoading}
          className={errors.address ? 'border-destructive' : ''}
        />
        {errors.address && (
          <p className="text-xs text-destructive">{errors.address}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <RequiredFieldLabel htmlFor="quick-city">City</RequiredFieldLabel>
          <Input
            id="quick-city"
            value={formData.city}
            onChange={(e) => onChange('city', e.target.value)}
            disabled={isLoading}
            className={errors.city ? 'border-destructive' : ''}
          />
          {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
        </div>
        <div className="space-y-2">
          <RequiredFieldLabel htmlFor="quick-state">State</RequiredFieldLabel>
          <Input
            id="quick-state"
            value={formData.state}
            onChange={(e) => onChange('state', e.target.value)}
            disabled={isLoading}
            className={errors.state ? 'border-destructive' : ''}
          />
          {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
        </div>
        <div className="space-y-2">
          <RequiredFieldLabel htmlFor="quick-zip">Zip</RequiredFieldLabel>
          <Input
            id="quick-zip"
            value={formData.zip}
            onChange={(e) => onChange('zip', e.target.value)}
            disabled={isLoading}
            className={errors.zip ? 'border-destructive' : ''}
          />
          {errors.zip && <p className="text-xs text-destructive">{errors.zip}</p>}
        </div>
      </div>
    </div>
  );
}
