import { useCallback, useEffect, useMemo, useState } from 'react';

function storageKey({ departmentSlug, patientId, appointmentId }) {
  return `hms.specialtyEncounter.${departmentSlug}.${patientId || 'unknown'}.${appointmentId || 'none'}`;
}

function loadState(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { values: {}, checks: {}, queuedOrders: [] };
    const parsed = JSON.parse(raw);
    return {
      values: parsed.values || {},
      checks: parsed.checks || {},
      queuedOrders: Array.isArray(parsed.queuedOrders) ? parsed.queuedOrders : [],
    };
  } catch {
    return { values: {}, checks: {}, queuedOrders: [] };
  }
}

export function useSpecialtyEncounterState({ departmentSlug, patientId, appointmentId, clinicalChecks = [] }) {
  const key = useMemo(
    () => storageKey({ departmentSlug, patientId, appointmentId }),
    [departmentSlug, patientId, appointmentId],
  );

  const [state, setState] = useState(() => loadState(key));
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    setState(loadState(key));
    setSavedAt(null);
  }, [key]);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
      setSavedAt(new Date().toISOString());
    } catch {
      // ignore quota / private mode
    }
  }, [key, state]);

  const setField = useCallback((fieldKey, value) => {
    setState((prev) => ({
      ...prev,
      values: { ...prev.values, [fieldKey]: value },
    }));
  }, []);

  const setTabValues = useCallback((patch) => {
    setState((prev) => ({
      ...prev,
      values: { ...prev.values, ...patch },
    }));
  }, []);

  const toggleCheck = useCallback((label) => {
    setState((prev) => ({
      ...prev,
      checks: { ...prev.checks, [label]: !prev.checks[label] },
    }));
  }, []);

  const queueOrder = useCallback((orderName) => {
    setState((prev) => {
      if (prev.queuedOrders.includes(orderName)) return prev;
      return { ...prev, queuedOrders: [...prev.queuedOrders, orderName] };
    });
  }, []);

  const clearQueuedOrder = useCallback((orderName) => {
    setState((prev) => ({
      ...prev,
      queuedOrders: prev.queuedOrders.filter((o) => o !== orderName),
    }));
  }, []);

  const resetAll = useCallback(() => {
    setState({ values: {}, checks: {}, queuedOrders: [] });
  }, []);

  const checkProgress = useMemo(() => {
    const total = clinicalChecks.length;
    if (!total) return { done: 0, total: 0, percent: 0 };
    const done = clinicalChecks.filter((c) => state.checks[c]).length;
    return { done, total, percent: Math.round((done / total) * 100) };
  }, [clinicalChecks, state.checks]);

  return {
    values: state.values,
    checks: state.checks,
    queuedOrders: state.queuedOrders,
    savedAt,
    checkProgress,
    setField,
    setTabValues,
    toggleCheck,
    queueOrder,
    clearQueuedOrder,
    resetAll,
  };
}
