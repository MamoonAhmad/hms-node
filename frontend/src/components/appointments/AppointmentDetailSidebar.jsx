import { Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { eventStatusChipClass } from '@/lib/appointmentEventStatus';
import {
  appointmentStatusSoftClass,
  normalizeAppointmentStatus,
} from '@/lib/appointmentStatuses';
import {
  formatGenderLabel,
  formatPatientListName,
  formatPatientListPhone,
} from '@/components/patients/listing/patientListUtils';
import { formatPatientAddress } from '@/pages/patient-dashboard/patientChartUtils';
import { cn } from '@/lib/utils';

function DetailRow({ label, children }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="text-sm font-medium text-foreground">{children || '—'}</div>
    </div>
  );
}

function formatInsuranceInfo(patient) {
  if (!patient) return '—';
  const billing = String(patient.billingType || '').toLowerCase();
  if (billing === 'self_pay' || billing === 'self-pay') return 'Self Pay';

  const insurances = Array.isArray(patient.insurances)
    ? patient.insurances
    : Array.isArray(patient.insuranceList)
      ? patient.insuranceList
      : [];

  if (insurances.length) {
    return (
      <ul className="space-y-2">
        {insurances.map((ins) => {
          const payer =
            ins.insuranceProvider?.name ||
            ins.payerName ||
            (typeof patient.insuranceProvider === 'string' ? patient.insuranceProvider : null) ||
            'Insurance';
          const type = ins.insuranceType || ins.insuranceTypeKey || 'Coverage';
          const member = ins.memberId || ins.policyNumber;
          const plan = ins.planName;
          return (
            <li key={ins.id || `${type}-${member || payer}`} className="rounded-md border bg-muted/20 px-3 py-2">
              <div className="capitalize">{String(type).replace(/_/g, ' ')}</div>
              <div className="text-muted-foreground font-normal">
                {[payer, plan, member ? `Member ID: ${member}` : null].filter(Boolean).join(' · ')}
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  if (patient.insuranceProvider?.name) return patient.insuranceProvider.name;
  if (typeof patient.insuranceProvider === 'string' && patient.insuranceProvider.trim()) {
    return patient.insuranceProvider;
  }
  return '—';
}

function formatConsentInfo(patient) {
  if (!patient) return '—';
  const signed =
    patient.consentFormSigned ||
    patient.consentSigned ||
    (Array.isArray(patient.consentSignatures) && patient.consentSignatures.length > 0);

  if (!signed) return 'Not signed';

  const signatures = Array.isArray(patient.consentSignatures) ? patient.consentSignatures : [];
  if (!signatures.length) return 'Signed';

  return (
    <ul className="space-y-1">
      {signatures.map((sig) => (
        <li key={sig.id || sig.consentFormId} className="font-normal text-muted-foreground">
          Signed
          {sig.signedAt
            ? ` · ${new Date(sig.signedAt).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}`
            : ''}
        </li>
      ))}
    </ul>
  );
}

export function AppointmentDetailSidebar({
  open,
  onClose,
  appointment,
  isLoading = false,
  statusCatalog: _statusCatalog = [],
}) {
  if (!open) return null;

  const patient = appointment?.patient;
  const appointmentStatus = normalizeAppointmentStatus(appointment?.status);
  const encounterStatus = appointment?.eventStatus || 'Scheduled';

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/40"
        aria-label="Close appointment details"
        onClick={onClose}
      />
      <aside
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l bg-card shadow-xl',
          'animate-in slide-in-from-right duration-200',
        )}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Appointment details</h2>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-5">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading appointment details…</p>
          ) : !appointment ? (
            <p className="text-sm text-muted-foreground">No appointment selected.</p>
          ) : (
            <>
              <section className="space-y-4 rounded-lg border bg-muted/20 p-4">
                <DetailRow label="Patient name">{formatPatientListName(patient)}</DetailRow>
                <DetailRow label="Encounter number">
                  <span className="font-mono tabular-nums">{appointment.encounterNumber || '—'}</span>
                </DetailRow>
                <DetailRow label="MRN number">
                  <span className="font-mono tabular-nums">{patient?.mrn || '—'}</span>
                </DetailRow>
                <DetailRow label="Gender">{formatGenderLabel(patient?.gender)}</DetailRow>
                <DetailRow label="Phone">{formatPatientListPhone(patient)}</DetailRow>
                <DetailRow label="Address">{formatPatientAddress(patient) || '—'}</DetailRow>
              </section>

              <section className="space-y-4 rounded-lg border bg-muted/20 p-4">
                <DetailRow label="Insurance information">{formatInsuranceInfo(patient)}</DetailRow>
                <DetailRow label="Consent form information">{formatConsentInfo(patient)}</DetailRow>
              </section>

              <section className="space-y-4 rounded-lg border bg-muted/20 p-4">
                <DetailRow label="Appointment status">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                      appointmentStatusSoftClass(appointmentStatus),
                    )}
                  >
                    {appointmentStatus}
                  </span>
                </DetailRow>
                <DetailRow label="Encounter status">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                      eventStatusChipClass(encounterStatus),
                    )}
                  >
                    {encounterStatus}
                  </span>
                </DetailRow>
              </section>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
