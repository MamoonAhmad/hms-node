import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { appointmentApi, patientApi } from '@/services/api';
import { orderApi } from '@/services/api.js';
import {
  mapAppointmentToEncounter,
  pickActiveAppointment,
} from './patientChartUtils';
import { getSampleChartData, SAMPLE_PATIENT_ID } from './patientDashboardSample';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PatientChartContext = createContext(null);

function mapLiveAppointment(row) {
  return {
    ...row,
    appointmentType: row.appointmentType || row.appointmentTypeRef?.name || null,
  };
}

export function PatientChartProvider({ children }) {
  const { patientId: routePatientId } = useParams();
  const [searchParams] = useSearchParams();
  const queryAppointmentId = searchParams.get('appointmentId');

  const isSampleChart = !routePatientId || routePatientId === SAMPLE_PATIENT_ID;
  const patientId = isSampleChart ? SAMPLE_PATIENT_ID : routePatientId;

  const [chartData, setChartData] = useState(() => getSampleChartData());
  const [appointmentId, setAppointmentId] = useState(
    () => queryAppointmentId || getSampleChartData().defaultAppointmentId,
  );
  const [notesDirty, setNotesDirty] = useState(false);
  const [visitStatus, setVisitStatus] = useState(null);
  const [loading, setLoading] = useState(!isSampleChart);
  const [error, setError] = useState(null);
  const [summaryRefreshKey, setSummaryRefreshKey] = useState(0);

  const loadLiveChart = useCallback(async (id, preferredAppointmentId) => {
    if (!id || !UUID_RE.test(id)) {
      setError('Invalid patient ID');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [patientRes, appointmentRes] = await Promise.all([
        patientApi.getById(id),
        appointmentApi.getAll({ patientId: id, limit: 100 }),
      ]);

      const patient = patientRes.data;
      const appointments = (appointmentRes.data || []).map(mapLiveAppointment);
      const active =
        (preferredAppointmentId &&
          appointments.find((a) => a.id === preferredAppointmentId)) ||
        pickActiveAppointment(appointments);

      let orders = [];
      if (active?.id) {
        const orderRes = await orderApi.getOrders({ patientId: id, appointmentId: active.id, limit: 100 });
        orders = orderRes.data || [];
      } else {
        const orderRes = await orderApi.getOrders({ patientId: id, limit: 100 });
        orders = orderRes.data || [];
      }

      setChartData({ patient, appointments, orders });
      setAppointmentId(active?.id || appointments[0]?.id || null);
      setVisitStatus(null);
      setSummaryRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err.message || 'Failed to load patient chart');
      setChartData({ patient: null, appointments: [], orders: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSampleChart) return;
    loadLiveChart(routePatientId, queryAppointmentId);
  }, [isSampleChart, routePatientId, queryAppointmentId, loadLiveChart]);

  const refreshChart = useCallback(async () => {
    if (isSampleChart) {
      const data = getSampleChartData();
      setChartData(data);
      setAppointmentId(data.defaultAppointmentId);
      setVisitStatus(null);
      setSummaryRefreshKey((k) => k + 1);
      return;
    }
    await loadLiveChart(routePatientId, appointmentId);
  }, [isSampleChart, loadLiveChart, routePatientId, appointmentId]);

  const { patient, appointments, orders } = chartData;

  const appointment = useMemo(
    () => appointments.find((a) => a.id === appointmentId) ?? null,
    [appointments, appointmentId],
  );

  const encounter = useMemo(() => {
    const base = mapAppointmentToEncounter(appointment);
    if (!base) return null;
    if (visitStatus) return { ...base, visitStatus };
    return base;
  }, [appointment, visitStatus]);

  useEffect(() => {
    if (appointment?.id) {
      const base = mapAppointmentToEncounter(appointment);
      if (base?.visitStatus) setVisitStatus(base.visitStatus);
    }
  }, [appointment?.id]);

  const tabCounts = useMemo(() => {
    const pendingOrders = orders.filter(
      (o) => o.status === 'Scheduled' || o.status === 'Pending',
    ).length;
    const pendingResults = orders.filter(
      (o) => o.category === 'Lab' && o.status === 'Scheduled',
    ).length;
    return { pendingOrders, pendingResults };
  }, [orders]);

  const advanceVisitStatus = useCallback((nextStatus) => {
    setVisitStatus(nextStatus);
    const statusMap = {
      Arrived: 'Checked-In',
      Roomed: 'Checked-In',
      'With Provider': 'In Progress',
      Checkout: 'Completed',
    };
    const apiStatus = statusMap[nextStatus];
    if (!apiStatus || !appointmentId) return;
    setChartData((prev) => ({
      ...prev,
      appointments: prev.appointments.map((a) =>
        a.id === appointmentId ? { ...a, status: apiStatus } : a,
      ),
    }));
  }, [appointmentId]);

  const value = useMemo(
    () => ({
      patientId,
      patient,
      appointments,
      appointment,
      appointmentId,
      setAppointmentId,
      encounter,
      orders,
      setOrders: (updater) => {
        setChartData((prev) => ({
          ...prev,
          orders: typeof updater === 'function' ? updater(prev.orders) : updater,
        }));
        setSummaryRefreshKey((k) => k + 1);
      },
      loading,
      error,
      refreshChart,
      refreshSummary: () => setSummaryRefreshKey((k) => k + 1),
      summaryRefreshKey,
      selectPatient: () => {},
      tabCounts,
      notesDirty,
      setNotesDirty,
      advanceVisitStatus,
      hasPatient: Boolean(patient),
      isSampleChart,
      resolvingDefaultPatient: loading && !patient,
    }),
    [
      patientId,
      patient,
      appointments,
      appointment,
      appointmentId,
      encounter,
      orders,
      loading,
      error,
      refreshChart,
      summaryRefreshKey,
      tabCounts,
      notesDirty,
      advanceVisitStatus,
      isSampleChart,
    ],
  );

  return (
    <PatientChartContext.Provider value={value}>{children}</PatientChartContext.Provider>
  );
}

export function usePatientChart() {
  const ctx = useContext(PatientChartContext);
  if (!ctx) throw new Error('usePatientChart must be used within PatientChartProvider');
  return ctx;
}
