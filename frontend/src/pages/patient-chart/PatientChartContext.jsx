import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { patientApi } from '@/services/api/patient.api';
import { orderApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { buildPermissions, buildSafetyAlerts } from './patientChartHelpers';

const PatientChartContext = createContext(null);

export function PatientChartProvider({ patientId, children }) {
  const { user } = useAuth();

  const [patient, setPatient] = useState(null);
  const [summary, setSummary] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const permissions = useMemo(() => buildPermissions(user), [user]);

  const load = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);

    let loadedPatient = null;
    try {
      const res = await patientApi.getById(patientId);
      loadedPatient = res?.data ?? null;
      if (!loadedPatient) throw new Error('Patient not found');
      setPatient(loadedPatient);
    } catch (err) {
      setError(err.message || 'Unable to load patient information. Please try again.');
      setPatient(null);
      setLoading(false);
      return;
    }

    // Secondary data loads independently; failures degrade gracefully.
    try {
      const [summaryRes, apptRes, ordersRes] = await Promise.allSettled([
        patientApi.getSummary(patientId),
        patientApi.getEncounters(patientId),
        orderApi.getOrders({ patientId, limit: 500 }),
      ]);

      setSummary(summaryRes.status === 'fulfilled' ? summaryRes.value?.data ?? null : null);
      setAppointments(apptRes.status === 'fulfilled' ? apptRes.value?.data ?? [] : []);
      setOrders(ordersRes.status === 'fulfilled' ? ordersRes.value?.data ?? [] : []);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const counts = useMemo(() => {
    const openOrders = orders.filter((o) => !['Completed', 'Cancelled', 'Resulted'].includes(o.status)).length;
    return {
      encounters: appointments.length,
      appointments: appointments.length,
      problems: summary?.problems?.length ?? 0,
      allergies: summary?.noKnownDrugAllergies ? 0 : summary?.allergies?.length ?? 0,
      orders: openOrders,
      documents: patient?._count?.documents ?? patient?.documentsCount ?? 0,
    };
  }, [orders, appointments, summary, patient]);

  const safetyAlerts = useMemo(
    () => buildSafetyAlerts({ patient, summary }),
    [patient, summary],
  );

  const value = useMemo(
    () => ({
      patientId,
      patient,
      summary,
      appointments,
      orders,
      loading,
      error,
      refresh,
      refreshKey,
      counts,
      safetyAlerts,
      permissions,
      user,
    }),
    [
      patientId,
      patient,
      summary,
      appointments,
      orders,
      loading,
      error,
      refresh,
      refreshKey,
      counts,
      safetyAlerts,
      permissions,
      user,
    ],
  );

  return <PatientChartContext.Provider value={value}>{children}</PatientChartContext.Provider>;
}

export function usePatientChartData() {
  const ctx = useContext(PatientChartContext);
  if (!ctx) throw new Error('usePatientChartData must be used within PatientChartProvider');
  return ctx;
}

export function PatientChartRouteProvider({ children }) {
  const { patientId } = useParams();
  return <PatientChartProvider patientId={patientId}>{children}</PatientChartProvider>;
}
