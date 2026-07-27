import { useEffect, useMemo, useState } from 'react';
import {
  appointmentApi,
  appointmentTypeApi,
  providerScheduleApi,
} from '@/services/api';
import { isGeneralAppointmentVisitType } from '@/components/patients/patientRegistrationAppointmentConstants';

function normalizeTypeName(name) {
  return String(name || '').trim().toLowerCase();
}

function collectScheduleTypes(schedules) {
  const ids = new Set();
  const names = new Set();
  schedules.forEach((schedule) => {
    (schedule.appointmentTypeIds || []).forEach((id) => {
      if (id) ids.add(id);
    });
    (schedule.appointmentType || []).forEach((name) => {
      if (name) names.add(name);
    });
  });
  return { ids, names };
}

function catalogTypeMatchesSchedule(type, scheduleIds, scheduleNames) {
  if (!scheduleIds.size && !scheduleNames.size) return true;
  if (type.id && scheduleIds.has(type.id)) return true;
  const normalized = normalizeTypeName(type.name);
  return [...scheduleNames].some((name) => normalizeTypeName(name) === normalized);
}

function isProviderRequiredType(type) {
  return type?.providerRequired === true;
}

function toTypeOption(type) {
  return {
    id: type.id,
    value: type.name,
    label: type.name,
    defaultTime: type.defaultTime ?? null,
    isSystem: type.isSystem === true,
    providerRequired: type.providerRequired === true,
  };
}

function isGlobalCatalogType(type) {
  // General / non-restricted types are available for every provider.
  return !isProviderRequiredType(type) || isGeneralAppointmentVisitType(type?.name);
}

/** Types available to all providers (not restricted to schedule assignment). */
function globalCatalogOptions(appointmentTypes) {
  return appointmentTypes.filter(isGlobalCatalogType).map(toTypeOption);
}

function selectedTypeMatchesSchedule(appointmentType, appointmentTypes, scheduleIds, scheduleNames) {
  if (!appointmentType) return true;

  const catalogMatch = appointmentTypes.find(
    (type) =>
      type.id === appointmentType ||
      normalizeTypeName(type.name) === normalizeTypeName(appointmentType),
  );

  // General and other global types are always valid for any provider.
  if (catalogMatch && isGlobalCatalogType(catalogMatch)) {
    return true;
  }

  // Restricted types are only valid when assigned on the provider's schedule.
  if (catalogMatch && isProviderRequiredType(catalogMatch)) {
    if (!scheduleIds.size && !scheduleNames.size) return false;
    return catalogTypeMatchesSchedule(catalogMatch, scheduleIds, scheduleNames);
  }

  if (!scheduleIds.size && !scheduleNames.size) return true;

  if (catalogMatch && catalogTypeMatchesSchedule(catalogMatch, scheduleIds, scheduleNames)) {
    return true;
  }

  return [...scheduleNames].some(
    (name) => normalizeTypeName(name) === normalizeTypeName(appointmentType),
  );
}

/**
 * Loads provider schedule–based available dates/times (respects block hours server-side).
 */
export function useAppointmentAvailability({
  enabled = true,
  providerId,
  departmentId,
  appointmentType,
  appointmentDate,
  excludeAppointmentId,
}) {
  const [availableDates, setAvailableDates] = useState(null);
  const [availableDatesLoading, setAvailableDatesLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
  const [timeSlotOptions, setTimeSlotOptions] = useState(null);
  const [timeSlotsLoading, setTimeSlotsLoading] = useState(false);
  const [providerScheduleTypeIds, setProviderScheduleTypeIds] = useState(() => new Set());
  const [providerScheduleTypeNames, setProviderScheduleTypeNames] = useState(() => new Set());
  const [hasProviderSchedules, setHasProviderSchedules] = useState(false);
  const [scheduleTypesLoading, setScheduleTypesLoading] = useState(false);
  const [appointmentTypes, setAppointmentTypes] = useState([]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    appointmentTypeApi
      .getActive()
      .then((res) => {
        if (!cancelled) setAppointmentTypes(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setAppointmentTypes([]);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !providerId) {
      setProviderScheduleTypeIds(new Set());
      setProviderScheduleTypeNames(new Set());
      setHasProviderSchedules(false);
      setScheduleTypesLoading(false);
      return;
    }
    let cancelled = false;
    setScheduleTypesLoading(true);
    providerScheduleApi
      .getAll({
        providerIds: [providerId],
        status: 'Active',
        limit: 100,
        ...(departmentId ? { departmentId } : {}),
      })
      .then((res) => {
        if (cancelled) return;
        const schedules = res.data || [];
        const { ids, names } = collectScheduleTypes(schedules);
        setHasProviderSchedules(schedules.length > 0);
        setProviderScheduleTypeIds(ids);
        setProviderScheduleTypeNames(names);
      })
      .catch(() => {
        if (!cancelled) {
          setProviderScheduleTypeIds(new Set());
          setProviderScheduleTypeNames(new Set());
          setHasProviderSchedules(false);
        }
      })
      .finally(() => {
        if (!cancelled) setScheduleTypesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, providerId, departmentId]);

  // Global catalog only — provider-required types are excluded until a schedule assigns them.
  const appointmentTypeOptions = useMemo(
    () => globalCatalogOptions(appointmentTypes),
    [appointmentTypes],
  );

  const filteredAppointmentTypeOptions = useMemo(() => {
    if (!appointmentTypes.length) return [];

    // No provider / still loading / no schedules → only global (non-restricted) types.
    if (!providerId || scheduleTypesLoading || !hasProviderSchedules) {
      return globalCatalogOptions(appointmentTypes);
    }

    // Always include General / global types; add provider-required types only when assigned.
    const seen = new Set();
    const options = [];

    for (const type of appointmentTypes) {
      const include =
        isGlobalCatalogType(type) ||
        catalogTypeMatchesSchedule(type, providerScheduleTypeIds, providerScheduleTypeNames);
      if (!include) continue;
      const key = type.id || normalizeTypeName(type.name);
      if (seen.has(key)) continue;
      seen.add(key);
      options.push(toTypeOption(type));
    }

    if (options.length) return options;

    if (!providerScheduleTypeIds.size && !providerScheduleTypeNames.size) {
      return globalCatalogOptions(appointmentTypes);
    }

    return [...providerScheduleTypeNames].map((name) => ({
      id: null,
      value: name,
      label: name,
      defaultTime: null,
      isSystem: false,
      providerRequired: false,
    }));
  }, [
    appointmentTypes,
    providerScheduleTypeIds,
    providerScheduleTypeNames,
    providerId,
    hasProviderSchedules,
    scheduleTypesLoading,
  ]);

  const appointmentTypeAllowed = useMemo(
    () =>
      selectedTypeMatchesSchedule(
        appointmentType,
        appointmentTypes,
        providerScheduleTypeIds,
        providerScheduleTypeNames,
      ),
    [
      appointmentType,
      appointmentTypes,
      providerScheduleTypeIds,
      providerScheduleTypeNames,
    ],
  );

  const availabilityReady =
    Boolean(providerId) && hasProviderSchedules && !scheduleTypesLoading;

  useEffect(() => {
    if (!enabled || !providerId || !availabilityReady) {
      setAvailableDates(null);
      setAvailableDatesLoading(false);
      setAvailabilityError('');
      return;
    }

    if (appointmentType && !appointmentTypeAllowed) {
      setAvailableDates(new Set());
      setAvailableDatesLoading(false);
      setAvailabilityError('');
      return;
    }

    let cancelled = false;
    setAvailableDatesLoading(true);
    setAvailabilityError('');
    appointmentApi
      .getAvailableDates({
        providerId,
        departmentId: departmentId || undefined,
        appointmentType: appointmentType || undefined,
      })
      .then((res) => {
        if (cancelled) return;
        setAvailableDates(new Set(res.data?.dates || []));
      })
      .catch((err) => {
        if (cancelled) return;
        setAvailableDates(new Set());
        setAvailabilityError(err.message || 'Failed to load available dates');
      })
      .finally(() => {
        if (!cancelled) setAvailableDatesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    providerId,
    departmentId,
    appointmentType,
    appointmentTypeAllowed,
    availabilityReady,
  ]);

  useEffect(() => {
    if (
      !enabled ||
      !providerId ||
      !appointmentDate ||
      !availabilityReady ||
      isGeneralAppointmentVisitType(appointmentType)
    ) {
      setTimeSlotOptions(null);
      setTimeSlotsLoading(false);
      return;
    }

    if (appointmentType && !appointmentTypeAllowed) {
      setTimeSlotOptions([]);
      setTimeSlotsLoading(false);
      return;
    }

    let cancelled = false;
    setTimeSlotsLoading(true);
    appointmentApi
      .getAvailableSlots({
        providerId,
        departmentId: departmentId || undefined,
        date: appointmentDate,
        appointmentType: appointmentType || undefined,
        excludeAppointmentId,
      })
      .then((res) => {
        if (cancelled) return;
        const slots = (res.data?.slots || []).map((slot) => ({
          value: slot.value || slot.startTime,
          label: slot.label || `${slot.startTime} - ${slot.endTime}`,
          endTime: slot.endTime || null,
          duration: slot.duration ?? null,
        }));
        setTimeSlotOptions(slots.length ? slots : []);
      })
      .catch(() => {
        if (!cancelled) setTimeSlotOptions([]);
      })
      .finally(() => {
        if (!cancelled) setTimeSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    providerId,
    departmentId,
    appointmentDate,
    appointmentType,
    appointmentTypeAllowed,
    availabilityReady,
    excludeAppointmentId,
  ]);

  return {
    availableDates,
    availableDatesLoading,
    availabilityError,
    timeSlotOptions,
    timeSlotsLoading,
    scheduleTypesLoading,
    hasProviderSchedules,
    appointmentTypeOptions,
    filteredAppointmentTypeOptions,
  };
};
