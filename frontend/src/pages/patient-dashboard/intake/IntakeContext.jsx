import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { usePatientChart } from '../PatientChartContext';
import { intakeApi } from '@/services/api/intake.api';

const IntakeContext = createContext(null);

export function IntakeProvider({ children }) {
  const { patientId, appointmentId, patient, isSampleChart, advanceVisitStatus } = usePatientChart();
  const [bundle, setBundle] = useState({ records: [], status: null, allergies: [], noKnownDrugAllergies: false });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isLive = !isSampleChart;

  const loadIntake = useCallback(async () => {
    if (!isLive || !patientId) {
      setBundle({ records: [], status: null, allergies: [], noKnownDrugAllergies: false });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await intakeApi.getBundle(patientId, { encounterId: appointmentId });
      setBundle(res.data || { records: [], status: null, allergies: [], noKnownDrugAllergies: false });
    } catch (err) {
      setError(err.message || 'Failed to load intake data');
    } finally {
      setLoading(false);
    }
  }, [isLive, patientId, appointmentId]);

  useEffect(() => {
    loadIntake();
  }, [loadIntake]);

  const getRecordsBySection = useCallback(
    (sectionType) => bundle.records.filter((r) => r.sectionType === sectionType),
    [bundle.records],
  );

  const saveSection = useCallback(
    async ({ sectionType, payload, score, notes }) => {
      if (!isLive) {
        const local = {
          id: `local-${Date.now()}`,
          sectionType,
          payload,
          score,
          notes,
          createdAt: new Date().toISOString(),
          addendums: [],
        };
        setBundle((prev) => ({ ...prev, records: [local, ...prev.records] }));
        return local;
      }
      setSaving(true);
      try {
        const res = await intakeApi.createRecord(patientId, {
          sectionType,
          appointmentId: appointmentId || null,
          payload,
          score,
          notes,
        });
        await loadIntake();
        return res.data;
      } finally {
        setSaving(false);
      }
    },
    [isLive, patientId, appointmentId, loadIntake],
  );

  const updateRecord = useCallback(
    async (recordId, { payload, score, notes }) => {
      if (!isLive) {
        setBundle((prev) => ({
          ...prev,
          records: prev.records.map((r) =>
            r.id === recordId
              ? {
                  ...r,
                  ...(payload !== undefined ? { payload } : {}),
                  ...(score !== undefined ? { score } : {}),
                  ...(notes !== undefined ? { notes } : {}),
                }
              : r,
          ),
        }));
        return null;
      }
      setSaving(true);
      try {
        const res = await intakeApi.updateRecord(patientId, recordId, { payload, score, notes });
        await loadIntake();
        return res.data;
      } finally {
        setSaving(false);
      }
    },
    [isLive, patientId, loadIntake],
  );

  const addAddendum = useCallback(
    async (recordId, { payload, notes }) => {
      if (!isLive) {
        await loadIntake();
        return null;
      }
      setSaving(true);
      try {
        const res = await intakeApi.addAddendum(patientId, recordId, { payload, notes });
        await loadIntake();
        return res.data;
      } finally {
        setSaving(false);
      }
    },
    [isLive, patientId, loadIntake],
  );

  const deleteRecord = useCallback(
    async (recordId) => {
      if (!isLive) {
        setBundle((prev) => ({
          ...prev,
          records: prev.records.filter((r) => r.id !== recordId),
        }));
        return;
      }
      await intakeApi.deleteRecord(patientId, recordId);
      await loadIntake();
    },
    [isLive, patientId, loadIntake],
  );

  const certifyIntake = useCallback(async () => {
    if (!isLive) {
      setBundle((prev) => ({
        ...prev,
        status: {
          ...prev.status,
          status: 'certified',
          certifiedAt: new Date().toISOString(),
          certifiedByName: 'Demo Nurse',
        },
      }));
      return;
    }
    const res = await intakeApi.certify(patientId, { appointmentId: appointmentId || null });
    await loadIntake();
    return res.data;
  }, [isLive, patientId, appointmentId, loadIntake]);

  const completeIntake = useCallback(
    async (completionNotes) => {
      if (!isLive) {
        setBundle((prev) => ({
          ...prev,
          status: {
            ...prev.status,
            status: 'completed',
            completedAt: new Date().toISOString(),
            completedByName: 'Demo Nurse',
            completionNotes,
          },
        }));
        advanceVisitStatus?.('With Provider');
        return;
      }
      const res = await intakeApi.complete(patientId, {
        appointmentId: appointmentId || null,
        completionNotes,
        accepted: true,
      });
      await loadIntake();
      advanceVisitStatus?.('With Provider');
      return res.data;
    },
    [isLive, patientId, appointmentId, loadIntake, advanceVisitStatus],
  );

  const intakeStatus = bundle.status;
  const isCertified = intakeStatus?.status === 'certified' || intakeStatus?.status === 'completed';
  const isCompleted = intakeStatus?.status === 'completed';

  const value = useMemo(
    () => ({
      patient,
      patientId,
      appointmentId,
      bundle,
      loading,
      saving,
      error,
      isLive,
      isCertified,
      isCompleted,
      intakeStatus,
      loadIntake,
      getRecordsBySection,
      saveSection,
      updateRecord,
      addAddendum,
      deleteRecord,
      certifyIntake,
      completeIntake,
      allergies: bundle.allergies,
      noKnownDrugAllergies: bundle.noKnownDrugAllergies,
      setBundle,
    }),
    [
      patient,
      patientId,
      appointmentId,
      bundle,
      loading,
      saving,
      error,
      isLive,
      isCertified,
      isCompleted,
      intakeStatus,
      loadIntake,
      getRecordsBySection,
      saveSection,
      updateRecord,
      addAddendum,
      deleteRecord,
      certifyIntake,
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
