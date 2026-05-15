import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useParams } from 'react-router-dom';
import {
  mapAppointmentToEncounter,
  pickActiveAppointment,
} from './patientChartUtils';
import { getSampleChartData, SAMPLE_PATIENT_ID } from './patientDashboardSample';

const PatientChartContext = createContext(null);

export function PatientChartProvider({ children }) {
  const { patientId: routePatientId } = useParams();
  const patientId = routePatientId || SAMPLE_PATIENT_ID;
  const isSampleChart = true;

  const [chartData, setChartData] = useState(() => getSampleChartData());
  const [appointmentId, setAppointmentId] = useState(
    () => getSampleChartData().defaultAppointmentId,
  );
  const [notesDirty, setNotesDirty] = useState(false);
  const [visitStatus, setVisitStatus] = useState(null);

  const refreshChart = useCallback(() => {
    const data = getSampleChartData();
    setChartData(data);
    setAppointmentId(data.defaultAppointmentId);
    setVisitStatus(null);
  }, []);

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
      },
      loading: false,
      error: null,
      refreshChart,
      selectPatient: () => {},
      tabCounts,
      notesDirty,
      setNotesDirty,
      advanceVisitStatus,
      hasPatient: Boolean(patient),
      isSampleChart,
      resolvingDefaultPatient: false,
    }),
    [
      patientId,
      patient,
      appointments,
      appointment,
      appointmentId,
      encounter,
      orders,
      refreshChart,
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
