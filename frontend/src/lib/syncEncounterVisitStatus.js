import { appointmentApi } from '@/services/api/appointment.api';
import {
  ENCOUNTER_VISIT_STATUS,
  shouldAdvanceEncounterStatus,
} from '@/lib/encounterVisitStatus';

/**
 * Advance encounter visit status from clinical UI actions (notes draft / lock).
 * Failures are swallowed so local note save is not blocked.
 */
export async function syncEncounterVisitStatus(appointmentId, nextStatus, currentStatus) {
  if (!appointmentId || !nextStatus) return null;
  if (currentStatus && !shouldAdvanceEncounterStatus(currentStatus, nextStatus)) {
    return null;
  }
  try {
    const res = await appointmentApi.updateStatus(appointmentId, nextStatus);
    return res?.data || res;
  } catch (err) {
    console.warn('Failed to sync encounter visit status:', err?.message || err);
    return null;
  }
}

export async function syncStatusForNotePersist(appointmentId, noteStatus, currentAppointmentStatus) {
  if (noteStatus === 'locked') {
    return syncEncounterVisitStatus(
      appointmentId,
      ENCOUNTER_VISIT_STATUS.PROVIDER_OUT,
      currentAppointmentStatus,
    );
  }
  if (noteStatus === 'draft' || noteStatus === 'signed') {
    return syncEncounterVisitStatus(
      appointmentId,
      ENCOUNTER_VISIT_STATUS.WITH_PROVIDER,
      currentAppointmentStatus,
    );
  }
  return null;
}
