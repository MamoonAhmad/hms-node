import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { checkoutApi } from '@/services/api/checkout.api';
import { usePatientChart } from '../PatientChartContext';
import { buildSampleCheckoutBundle } from './checkoutConstants';

const CheckoutContext = createContext(null);

export function CheckoutProvider({ children }) {
  const { patientId, appointmentId, patient, appointment, encounter, isSampleChart, refreshKey, refreshChart } =
    usePatientChart();

  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadBundle = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      if (isSampleChart) {
        setBundle(buildSampleCheckoutBundle(patient, appointment, encounter));
      } else if (appointmentId) {
        const res = await checkoutApi.getBundle(patientId, appointmentId);
        setBundle(res.data);
      } else {
        setBundle(null);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load checkout');
    } finally {
      setLoading(false);
    }
  }, [patientId, appointmentId, isSampleChart, patient, appointment, encounter]);

  useEffect(() => {
    loadBundle();
  }, [loadBundle, refreshKey]);

  const updateCheckout = useCallback(
    async (data) => {
      if (isSampleChart) {
        setBundle((prev) => ({
          ...prev,
          checkout: { ...prev.checkout, ...data },
        }));
        return;
      }
      if (!patientId || !appointmentId) return;
      setSaving(true);
      try {
        await checkoutApi.update(patientId, { encounterId: appointmentId, ...data });
        await loadBundle();
      } finally {
        setSaving(false);
      }
    },
    [isSampleChart, patientId, appointmentId, loadBundle],
  );

  const saveInstruction = useCallback(
    async (data, instructionId = null) => {
      if (isSampleChart) {
        setBundle((prev) => {
          const instructions = [...(prev.checkout.instructions || [])];
          if (instructionId) {
            const idx = instructions.findIndex((i) => i.id === instructionId);
            if (idx >= 0) instructions[idx] = { ...instructions[idx], ...data };
          } else {
            instructions.push({ id: `local-${Date.now()}`, ...data });
          }
          return { ...prev, checkout: { ...prev.checkout, instructions } };
        });
        return;
      }
      setSaving(true);
      try {
        await checkoutApi.saveInstruction(patientId, { encounterId: appointmentId, ...data }, instructionId);
        await loadBundle();
      } finally {
        setSaving(false);
      }
    },
    [isSampleChart, patientId, appointmentId, loadBundle],
  );

  const deleteInstruction = useCallback(
    async (instructionId) => {
      if (isSampleChart) {
        setBundle((prev) => ({
          ...prev,
          checkout: {
            ...prev.checkout,
            instructions: (prev.checkout.instructions || []).filter((i) => i.id !== instructionId),
          },
        }));
        return;
      }
      setSaving(true);
      try {
        await checkoutApi.deleteInstruction(patientId, instructionId, appointmentId);
        await loadBundle();
      } finally {
        setSaving(false);
      }
    },
    [isSampleChart, patientId, appointmentId, loadBundle],
  );

  const addNote = useCallback(
    async (data) => {
      if (isSampleChart) {
        setBundle((prev) => ({
          ...prev,
          checkout: {
            ...prev.checkout,
            notes: [{ id: `n-${Date.now()}`, ...data, createdAt: new Date().toISOString() }, ...(prev.checkout.notes || [])],
          },
        }));
        return;
      }
      setSaving(true);
      try {
        await checkoutApi.addNote(patientId, { encounterId: appointmentId, ...data });
        await loadBundle();
      } finally {
        setSaving(false);
      }
    },
    [isSampleChart, patientId, appointmentId, loadBundle],
  );

  const addTask = useCallback(
    async (data) => {
      if (isSampleChart) {
        setBundle((prev) => ({
          ...prev,
          checkout: {
            ...prev.checkout,
            tasks: [{ id: `t-${Date.now()}`, status: 'Open', ...data }, ...(prev.checkout.tasks || [])],
          },
        }));
        return;
      }
      setSaving(true);
      try {
        await checkoutApi.addTask(patientId, { encounterId: appointmentId, ...data });
        await loadBundle();
      } finally {
        setSaving(false);
      }
    },
    [isSampleChart, patientId, appointmentId, loadBundle],
  );

  const recordPayment = useCallback(
    async (data) => {
      if (isSampleChart) {
        const payment = {
          id: `p-${Date.now()}`,
          receiptNumber: `RCP-SAMPLE-${Date.now()}`,
          collectedByName: 'Demo User',
          createdAt: new Date().toISOString(),
          ...data,
        };
        setBundle((prev) => ({
          ...prev,
          checkout: { ...prev.checkout, payments: [payment, ...(prev.checkout.payments || [])] },
          billing: { ...prev.billing, paymentStatus: 'Collected' },
        }));
        return payment;
      }
      setSaving(true);
      try {
        const res = await checkoutApi.recordPayment(patientId, { encounterId: appointmentId, ...data });
        await loadBundle();
        return res.data;
      } finally {
        setSaving(false);
      }
    },
    [isSampleChart, patientId, appointmentId, loadBundle],
  );

  const completeCheckout = useCallback(async () => {
    if (isSampleChart) {
      setBundle((prev) => ({
        ...prev,
        status: 'completed',
        checkout: {
          ...prev.checkout,
          status: 'completed',
          isLocked: true,
          completedAt: new Date().toISOString(),
          completedByName: 'Demo User',
        },
      }));
      refreshChart();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await checkoutApi.complete(patientId, appointmentId);
      setBundle(res.data);
      await refreshChart();
    } catch (err) {
      setError(err?.message || 'Failed to complete checkout');
      if (err.blockers) setBundle((prev) => prev && { ...prev, validation: { canComplete: false, blockers: err.blockers } });
      throw err;
    } finally {
      setSaving(false);
    }
  }, [isSampleChart, patientId, appointmentId, loadBundle, refreshChart]);

  const reopenCheckout = useCallback(
    async (reason) => {
      if (isSampleChart) {
        setBundle((prev) => ({
          ...prev,
          status: 'in_progress',
          checkout: { ...prev.checkout, status: 'in_progress', isLocked: false, completedAt: null },
        }));
        return;
      }
      setSaving(true);
      try {
        const res = await checkoutApi.reopen(patientId, appointmentId, reason);
        setBundle(res.data);
        await refreshChart();
      } finally {
        setSaving(false);
      }
    },
    [isSampleChart, patientId, appointmentId, refreshChart],
  );

  const previewAvs = useCallback(async () => {
    if (isSampleChart) {
      return buildAvsHtmlFromBundle(bundle);
    }
    const res = await checkoutApi.previewAvs(patientId, appointmentId);
    return res.data.html;
  }, [isSampleChart, patientId, appointmentId, bundle]);

  const value = useMemo(
    () => ({
      bundle,
      loading,
      error,
      saving,
      appointmentId,
      isSampleChart,
      isLocked: bundle?.checkout?.isLocked ?? false,
      isCompleted: bundle?.status === 'completed',
      loadBundle,
      updateCheckout,
      saveInstruction,
      deleteInstruction,
      addNote,
      addTask,
      recordPayment,
      completeCheckout,
      reopenCheckout,
      previewAvs,
    }),
    [
      bundle,
      loading,
      error,
      saving,
      appointmentId,
      isSampleChart,
      loadBundle,
      updateCheckout,
      saveInstruction,
      deleteInstruction,
      addNote,
      addTask,
      recordPayment,
      completeCheckout,
      reopenCheckout,
      previewAvs,
    ],
  );

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
}

export function useCheckout() {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error('useCheckout must be used within CheckoutProvider');
  return ctx;
}

function buildAvsHtmlFromBundle(bundle) {
  if (!bundle) return '<html><body><p>No data</p></body></html>';
  const { header, clinicalReview, medications, orders, referrals, checkout } = bundle;
  const instructions = checkout.instructions || [];
  return `<!DOCTYPE html><html><head><title>After Visit Summary</title></head><body>
<h1>After Visit Summary</h1>
<p><strong>${header.patient.name}</strong> · MRN ${header.patient.mrn}</p>
<p>Visit: ${header.encounter.visitDate} · ${header.encounter.provider}</p>
<h2>Diagnosis</h2><ul>${clinicalReview.diagnoses.map((d) => `<li>${d.code || ''} ${d.description}</li>`).join('')}</ul>
<h2>Medications</h2><ul>${medications.map((m) => `<li>${m.medicationName}</li>`).join('')}</ul>
<h2>Instructions</h2>${instructions.map((i) => `<p><strong>${i.instructionType}</strong><br/>${i.content}</p>`).join('')}
</body></html>`;
}
