import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneNumberInput } from '@/components/ui/phone-number-input';
import { UsStateSelect } from '@/components/ui/us-state-select';
import { PatientPhotoUpload } from '@/components/patients/PatientPhotoUpload';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/services/api';
import { getUserDisplayName } from '@/lib/userDisplay';
import { getPhoneValidationError } from '@/lib/phoneNumberUtils';
import { getUsZipValidationError, normalizeUsZipInput } from '@/lib/usZip';

function splitLegacyName(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function profileFromUser(user) {
  const legacy = splitLegacyName(user?.name);
  return {
    firstName: user?.firstName || legacy.firstName || '',
    middleName: user?.middleName || '',
    lastName: user?.lastName || legacy.lastName || '',
    username: user?.username || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    address: user?.address || '',
    addressLine2: user?.addressLine2 || '',
    city: user?.city || '',
    state: user?.state || '',
    zip: user?.zip || '',
    profilePicture: user?.profilePicture || '',
    profilePictureFileName: '',
  };
}

export function UserProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState(() => profileFromUser(user));
  const [errors, setErrors] = useState({});
  const [bannerError, setBannerError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    authApi
      .getProfile()
      .then((res) => {
        if (cancelled) return;
        const profile = res?.data ?? res;
        if (profile) {
          setFormData(profileFromUser(profile));
          updateUser(profile);
        }
      })
      .catch((err) => {
        if (!cancelled) setBannerError(err.message || 'Failed to load profile');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, []);

  const displayName = useMemo(() => getUserDisplayName(formData), [formData]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
    setSuccessMessage(null);
    setBannerError(null);
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.firstName.trim()) nextErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) nextErrors.lastName = 'Last name is required';
    const phoneError = getPhoneValidationError(formData.phoneNumber);
    if (phoneError) nextErrors.phoneNumber = phoneError;
    const zipError = getUsZipValidationError(formData.zip);
    if (zipError) nextErrors.zip = zipError;
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBannerError(null);
    setSuccessMessage(null);
    if (!validate()) return;

    setIsSaving(true);
    try {
      const payload = {
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim(),
        lastName: formData.lastName.trim(),
        username: formData.username.trim(),
        phoneNumber: formData.phoneNumber,
        address: formData.address.trim(),
        addressLine2: formData.addressLine2.trim(),
        city: formData.city.trim(),
        state: formData.state,
        zip: formData.zip.trim(),
        profilePicture: formData.profilePicture || '',
      };
      const res = await authApi.updateProfile(payload);
      const updated = res?.data ?? res;
      if (updated) {
        updateUser(updated);
        setFormData(profileFromUser(updated));
      }
      setSuccessMessage('Profile saved successfully. Your top bar has been updated.');
    } catch (err) {
      setBannerError(err.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="ehr-page space-y-6">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <PageHeader
          title="My Profile"
          description="Update your account information and contact details."
        />
      </div>

      {bannerError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {bannerError}
        </div>
      )}
      {successMessage && (
        <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-6 space-y-6 max-w-3xl">
        <PatientPhotoUpload
          id="userProfilePicture"
          label="Profile picture"
          value={formData.profilePicture}
          fileName={formData.profilePictureFileName}
          error={errors.profilePicture}
          disabled={isSaving}
          onChange={({ photo, fileName, error: photoError }) => {
            handleChange('profilePicture', photo);
            handleChange('profilePictureFileName', fileName);
            setErrors((prev) => ({ ...prev, profilePicture: photoError || null }));
          }}
          onClear={() => {
            handleChange('profilePicture', '');
            handleChange('profilePictureFileName', '');
          }}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              className={errors.firstName ? 'border-destructive' : ''}
            />
            {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="middleName">Middle name</Label>
            <Input
              id="middleName"
              value={formData.middleName}
              onChange={(e) => handleChange('middleName', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              className={errors.lastName ? 'border-destructive' : ''}
            />
            {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              placeholder="Choose a username"
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={formData.email} disabled className="bg-muted" />
          </div>
        </div>

        <div className="space-y-2 max-w-md">
          <Label htmlFor="phoneNumber">Phone number</Label>
          <PhoneNumberInput
            id="phoneNumber"
            value={formData.phoneNumber}
            onChange={(value) => handleChange('phoneNumber', value)}
            error={errors.phoneNumber}
          />
        </div>

        <div className="space-y-4 border-t pt-4">
          <h3 className="text-sm font-semibold text-foreground">Address</h3>
          <div className="space-y-2">
            <Label htmlFor="address">Street address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="123 Main St"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressLine2">Address line 2</Label>
            <Input
              id="addressLine2"
              value={formData.addressLine2}
              onChange={(e) => handleChange('addressLine2', e.target.value)}
              placeholder="Apt, suite, unit"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <UsStateSelect
                id="state"
                value={formData.state}
                onChange={(value) => handleChange('state', value)}
                error={errors.state}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP</Label>
              <Input
                id="zip"
                value={formData.zip}
                onChange={(e) => handleChange('zip', normalizeUsZipInput(e.target.value))}
                placeholder="12345 or 12345-6789"
                className={errors.zip ? 'border-destructive' : ''}
              />
              {errors.zip && <p className="text-xs text-destructive">{errors.zip}</p>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{displayName}</span>
          </p>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save & Update'}
          </Button>
        </div>
      </form>
    </div>
  );
}
