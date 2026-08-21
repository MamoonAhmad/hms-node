import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useParams } from 'react-router-dom';
import { rcmEncounterApi } from '@/services/api';

const RcmEncounterContext = createContext(null);

export function RcmEncounterProvider({ children }) {
  const { encounterId } = useParams();
  const [encounter, setEncounter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!encounterId) {
      setError('Missing encounter ID');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await rcmEncounterApi.getById(encounterId);
      setEncounter(res.data);
    } catch (err) {
      setEncounter(null);
      setError(err.message || 'Failed to load encounter');
    } finally {
      setLoading(false);
    }
  }, [encounterId]);

  useEffect(() => {
    load();
  }, [load]);

  const applyResult = (res) => {
    setEncounter(res.data);
    return res.data;
  };

  const updateBillingStatus = useCallback(
    async (billingStatus) => {
      setSaving(true);
      try {
        const res = await rcmEncounterApi.updateBillingStatus(encounterId, billingStatus);
        return applyResult(res);
      } finally {
        setSaving(false);
      }
    },
    [encounterId],
  );

  const updateDiagnoses = useCallback(
    async (diagnoses) => {
      setSaving(true);
      try {
        const res = await rcmEncounterApi.updateDiagnoses(encounterId, diagnoses);
        return applyResult(res);
      } finally {
        setSaving(false);
      }
    },
    [encounterId],
  );

  const updateCharges = useCallback(
    async (charges) => {
      setSaving(true);
      try {
        const res = await rcmEncounterApi.updateCharges(encounterId, charges);
        return applyResult(res);
      } finally {
        setSaving(false);
      }
    },
    [encounterId],
  );

  const addPayment = useCallback(
    async (payload) => {
      setSaving(true);
      try {
        const res = await rcmEncounterApi.addPayment(encounterId, payload);
        return applyResult(res);
      } finally {
        setSaving(false);
      }
    },
    [encounterId],
  );

  const addFollowUpNote = useCallback(
    async (payload) => {
      setSaving(true);
      try {
        const res = await rcmEncounterApi.addFollowUpNote(encounterId, payload);
        return applyResult(res);
      } finally {
        setSaving(false);
      }
    },
    [encounterId],
  );

  const verifyEligibility = useCallback(async () => {
    setSaving(true);
    try {
      const res = await rcmEncounterApi.verifyEligibility(encounterId);
      await load();
      return res.data;
    } finally {
      setSaving(false);
    }
  }, [encounterId, load]);

  const value = useMemo(
    () => ({
      encounterId,
      encounter,
      loading,
      saving,
      error,
      refresh: load,
      updateBillingStatus,
      updateDiagnoses,
      updateCharges,
      addPayment,
      addFollowUpNote,
      verifyEligibility,
    }),
    [
      encounterId,
      encounter,
      loading,
      saving,
      error,
      load,
      updateBillingStatus,
      updateDiagnoses,
      updateCharges,
      addPayment,
      addFollowUpNote,
      verifyEligibility,
    ],
  );

  return (
    <RcmEncounterContext.Provider value={value}>{children}</RcmEncounterContext.Provider>
  );
}

export function useRcmEncounter() {
  const ctx = useContext(RcmEncounterContext);
  if (!ctx) throw new Error('useRcmEncounter must be used within RcmEncounterProvider');
  return ctx;
}
