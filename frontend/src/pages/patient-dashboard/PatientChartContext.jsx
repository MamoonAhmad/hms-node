import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { patientApi } from '@/services/api/patient.api';
import { appointmentApi } from '@/services/api/appointment.api';
import { orderApi } from '@/services/api';
import { medicationOrderApi } from '@/services/api/medicationOrder.api';
import { emarApi } from '@/services/api/emar.api';
import { referralApi } from '@/services/api/referral.api';
import {
  mapAppointmentToEncounter,
  pickActiveAppointment,
} from './patientChartUtils';
import { getSampleChartData, SAMPLE_PATIENT_ID } from './patientDashboardSample';
import {
  ENCOUNTER_STATUS_FLOW,
  mapAppointmentStatusToVisitStep,
  mapVisitStepToAppointmentStatus,
} from '@/lib/encounterVisitStatus';

const PatientChartContext = createContext(null);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isLivePatientId(id) {
  return Boolean(id && id !== SAMPLE_PATIENT_ID && UUID_RE.test(id));
}

export function PatientChartProvider({ children }) {
  const { patientId: routePatientId, departmentSlug } = useParams();
  const [searchParams] = useSearchParams();
  const urlAppointmentId = searchParams.get('appointmentId');
  const patientId = routePatientId || SAMPLE_PATIENT_ID;
  const isSampleChart = !isLivePatientId(patientId);

  const [chartData, setChartData] = useState(() =>
    isSampleChart
      ? getSampleChartData({ departmentSlug })
      : { patient: null, appointments: [], orders: [], chartSummary: null, medicationStatusCounts: null, emarTabCounts: null, referralSummary: null },
  );
  const [appointmentId, setAppointmentId] = useState(() => {
    const fromUrl = searchParams.get('appointmentId');
    if (fromUrl) return fromUrl;
    return isSampleChart
      ? getSampleChartData({ departmentSlug }).defaultAppointmentId
      : null;
  });
  const [notesDirty, setNotesDirty] = useState(false);
  const [visitStatus, setVisitStatus] = useState(null);
  const [loading, setLoading] = useState(!isSampleChart);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadChart = useCallback(async () => {
    if (!isLivePatientId(patientId)) {
      const data = getSampleChartData({ departmentSlug });
      setChartData(data);
      const fromUrl = urlAppointmentId;
      if (fromUrl && data.appointments.some((a) => a.id === fromUrl)) {
        setAppointmentId(fromUrl);
      } else {
        setAppointmentId(data.defaultAppointmentId);
      }
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    let patient = null;
    try {
      const patientRes = await patientApi.getById(patientId);
      patient = patientRes?.data ?? null;
      if (!patient) {
        throw new Error('Patient not found');
      }
    } catch (err) {
      setError(err.message || 'Failed to load patient');
      setChartData({
        patient: null,
        appointments: [],
        orders: [],
        chartSummary: null,
        medicationStatusCounts: null,
        emarTabCounts: null,
        referralSummary: null,
      });
      setLoading(false);
      return;
    }

    let appointments = [];
    let orders = [];
    try {
      const encountersRes = await patientApi.getEncounters(patientId);
      appointments = encountersRes.data || [];
    } catch {
      appointments = [];
    }

    try {
      const ordersRes = await orderApi.getOrders({ patientId, limit: 500 });
      orders = ordersRes.data || [];
    } catch {
      orders = [];
    }

    const activeAppt =
      urlAppointmentId && appointments.some((a) => a.id === urlAppointmentId)
        ? urlAppointmentId
        : pickActiveAppointment(appointments)?.id;

    let medicationStatusCounts = null;
    let emarTabCounts = null;
    let referralSummary = null;
    let chartSummary = null;

    try {
      const medCountsRes = await medicationOrderApi.getStatusCounts(patientId, {
        appointmentId: activeAppt || undefined,
      });
      medicationStatusCounts = medCountsRes.data;
    } catch {
      medicationStatusCounts = null;
    }

    try {
      const emarCountsRes = await emarApi.getTabCounts(patientId, {
        appointmentId: activeAppt || undefined,
      });
      emarTabCounts = emarCountsRes.data;
    } catch {
      emarTabCounts = null;
    }

    try {
      const referralSummaryRes = await referralApi.getSummary(patientId, {
        appointmentId: activeAppt || undefined,
      });
      referralSummary = referralSummaryRes.data;
    } catch {
      referralSummary = null;
    }

    try {
      const summaryRes = await patientApi.getSummary(patientId, {
        encounterId: activeAppt || undefined,
      });
      chartSummary = summaryRes.data;
    } catch {
      chartSummary = null;
    }

    setChartData({
      patient,
      appointments,
      orders,
      chartSummary,
      medicationStatusCounts,
      emarTabCounts,
      referralSummary,
    });

    const fromUrl = urlAppointmentId;
    if (fromUrl && appointments.some((a) => a.id === fromUrl)) {
      setAppointmentId(fromUrl);
    } else {
      const active = pickActiveAppointment(appointments);
      setAppointmentId(active?.id || null);
    }

    setLoading(false);
  }, [patientId, urlAppointmentId, departmentSlug]);

  useEffect(() => {
    loadChart();
  }, [loadChart, refreshKey]);

  const refreshChart = useCallback(() => {
    setVisitStatus(null);
    setRefreshKey((k) => k + 1);
  }, []);

  const { patient, appointments, orders, chartSummary, medicationStatusCounts, emarTabCounts, referralSummary } = chartData;

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
    if (urlAppointmentId) setAppointmentId(urlAppointmentId);
  }, [urlAppointmentId]);

  useEffect(() => {
    if (appointment?.id) {
      const base = mapAppointmentToEncounter(appointment);
      if (base?.visitStatus) setVisitStatus(base.visitStatus);
    }
  }, [appointment?.id]);

  const tabCounts = useMemo(() => {
    // Completed / Resulted / Cancelled should never appear as pending badges.
    const openStatuses = new Set(['Scheduled', 'Pending', 'In Progress']);
    const pendingOrders = orders.filter((o) => openStatuses.has(o.status)).length;
    const pendingResults = orders.filter(
      (o) =>
        (o.category === 'Lab' || o.category === 'Radiology') &&
        openStatuses.has(o.status),
    ).length;
    return {
      pendingOrders,
      pendingResults,
      draftMedications: medicationStatusCounts?.Draft ?? 0,
      pendingEmar: emarTabCounts?.active ?? 0,
      pendingReferrals: referralSummary?.pending ?? 0,
    };
  }, [orders, medicationStatusCounts, emarTabCounts, referralSummary]);

  const advanceVisitStatus = useCallback(
    (nextStatus) => {
      const barStep = ENCOUNTER_STATUS_FLOW.includes(nextStatus)
        ? nextStatus
        : mapAppointmentStatusToVisitStep(nextStatus);
      // Persist the granular visit step so encounters listing shows the same label.
      const persistStatus = ENCOUNTER_STATUS_FLOW.includes(nextStatus)
        ? nextStatus
        : mapVisitStepToAppointmentStatus(nextStatus) ||
          ([
            'Checked In',
            'Checked-In',
            'In Progress',
            'Checked Out',
            'Completed',
            'Visit Completed',
          ].includes(nextStatus)
            ? nextStatus
            : null);
      setVisitStatus(barStep);
      if (!persistStatus || !appointmentId) return;
      setChartData((prev) => ({
        ...prev,
        appointments: prev.appointments.map((a) =>
          a.id === appointmentId ? { ...a, status: persistStatus } : a,
        ),
      }));
      // Persist clinical visit status (best-effort)
      appointmentApi.updateStatus(appointmentId, persistStatus).catch(() => {});
    },
    [appointmentId],
  );

  const value = useMemo(
    () => ({
      patientId,
      patient,
      appointments,
      appointment,
      appointmentId,
      setAppointmentId,
      encounter,
      chartSummary,
      orders,
      setOrders: (updater) => {
        setChartData((prev) => ({
          ...prev,
          orders: typeof updater === 'function' ? updater(prev.orders) : updater,
        }));
      },
      loading,
      error,
      refreshChart,
      refreshKey,
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
      chartSummary,
      orders,
      loading,
      error,
      refreshChart,
      refreshKey,
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
