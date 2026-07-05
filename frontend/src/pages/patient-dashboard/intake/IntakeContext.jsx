import { createContext, useCallback, useContext, useMemo } from 'react';
import { usePatientChart } from '../PatientChartContext';
import { intakeApi } from '@/services/api';

const IntakeContext = createContext(null);

export function IntakeProvider({ children }) {
  const { patientId, appointmentId, refreshChart, isSampleChart } = usePatientChart();

  const canPersist = Boolean(patientId && !isSampleChart && patientId !== 'sample');

  const saveSection = useCallback(
    async (sectionKey, data, options = {}) => {
      if (!canPersist) return null;
      const res = await intakeApi.saveSection(patientId, sectionKey, {
        appointmentId: appointmentId || undefined,
        data,
        isAddendum: options.isAddendum || false,
        parentId: options.parentId || undefined,
      });
      return res.data;
    },
    [canPersist, patientId, appointmentId],
  );

  const loadSections = useCallback(
    async (sectionKey) => {
      if (!canPersist) return [];
      const res = sectionKey
        ? await intakeApi.getSection(patientId, sectionKey, {
            appointmentId: appointmentId || undefined,
          })
        : await intakeApi.getSections(patientId, { appointmentId: appointmentId || undefined });
      return res.data || [];
    },
    [canPersist, patientId, appointmentId],
  );

  const saveScreening = useCallback(
    async (payload) => {
      if (!canPersist) return null;
      const res = await intakeApi.saveScreening(patientId, {
        appointmentId: appointmentId || undefined,
        ...payload,
      });
      return res.data;
    },
    [canPersist, patientId, appointmentId],
  );

  const loadScreenings = useCallback(
    async (screeningType) => {
      if (!canPersist) return [];
      const res = await intakeApi.getScreenings(patientId, {
        appointmentId: appointmentId || undefined,
      });
      const rows = res.data || [];
      return screeningType ? rows.filter((r) => r.screeningType === screeningType) : rows;
    },
    [canPersist, patientId, appointmentId],
  );

  const completeIntake = useCallback(
    async ({ intakeNotes, certificationAccepted }) => {
      if (!canPersist) return null;
      const res = await intakeApi.completeIntake(patientId, {
        appointmentId: appointmentId || undefined,
        intakeNotes,
        certificationAccepted,
      });
      await refreshChart?.();
      return res.data;
    },
    [canPersist, patientId, appointmentId, refreshChart],
  );

  const value = useMemo(
    () => ({
      patientId,
      appointmentId,
      canPersist,
      saveSection,
      loadSections,
      saveScreening,
      loadScreenings,
      completeIntake,
    }),
    [
      patientId,
      appointmentId,
      canPersist,
      saveSection,
      loadSections,
      saveScreening,
      loadScreenings,
      completeIntake,
    ],
  );

  return <IntakeContext.Provider value={value}>{children}</IntakeContext.Provider>;
}

export function useIntake() {
  const ctx = useContext(IntakeContext);
  if (!ctx) throw new Error('useIntake must be used within IntakeProvider');
  return ctx;
}
