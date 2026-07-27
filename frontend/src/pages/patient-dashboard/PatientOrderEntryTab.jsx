import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Trash2, Save, Pencil, BookmarkPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS_SOFT } from '@/lib/statusColors';
import procedureCodesData from '@/data/procedureCodes.json';
import { useAuth } from '@/contexts/AuthContext';
import { orderApi, vaccineApi, radiologyStudyApi, labTestApi } from '@/services/api';
import { medicationCatalogApi } from '@/services/api/medicationCatalog.api';
import { usePatientChart } from './PatientChartContext';
import { apiOrderToRow } from './patientChartUtils';
import { ChartTabShell } from './components/chart-ui';
import { CUSTOM_ORDER_SETS_STORAGE_KEY, HANDLING_LABELS } from './medications/medicationConstants';
import { MedicationOrderDetailSidebar } from './medications/MedicationOrderDetailSidebar';
import { procedureToMedication } from './medications/medicationFormUtils';

function mapMedicineToOrderItem(med) {
  const strengthLabel = [med.strength, med.strengthUnit].filter(Boolean).join(' ').trim();
  const baseName = med.name || med.genericName || med.brandName || 'Medication';
  const name =
    strengthLabel && !String(baseName).toLowerCase().includes(String(med.strength || '').toLowerCase())
      ? `${baseName} ${strengthLabel}`
      : baseName;
  return {
    id: med.id,
    code: med.code || med.ndc || med.rxNorm || med.id,
    name,
    category: 'Pharmacy',
    subcategory:
      med.therapeuticCategory || med.medicationClass || med.dosageForm || undefined,
    strength: med.strength,
    strengthUnit: med.strengthUnit,
    dosageForm: med.dosageForm,
    route: med.route,
    genericName: med.genericName,
    brandName: med.brandName,
    medicationClass: med.medicationClass,
    therapeuticCategory: med.therapeuticCategory,
    formularyStatus: med.formularyStatus,
    formularyTier: med.formularyTier,
    preferredDrug: med.preferredDrug,
    ndcSafetyFlag: med.ndcSafetyFlag,
    defaultDose: med.defaultDose,
    defaultDoseUnit: med.defaultDoseUnit,
    defaultFrequency: med.defaultFrequency,
    defaultDuration: med.defaultDuration,
    durationUnit: med.durationUnit,
    source: 'medication-formulary',
  };
}

const MIN_SEARCH_LENGTH = 2;
const DEBOUNCE_MS = 300;

function loadCustomOrderSets() {
  try {
    const raw = localStorage.getItem(CUSTOM_ORDER_SETS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomOrderSets(sets) {
  localStorage.setItem(CUSTOM_ORDER_SETS_STORAGE_KEY, JSON.stringify(sets));
}

function procedureKey(procedure) {
  if (!procedure) return '';
  return String(procedure.id || `${procedure.category || ''}:${procedure.code || procedure.name || ''}`);
}

/** Categories use muted/info only — not a rainbow of unrelated hues. */
const CATEGORY_TAG_CLASSES = {
  Radiology: STATUS_SOFT.info,
  Lab: STATUS_SOFT.success,
  Pharmacy: STATUS_SOFT.info,
  Procedures: STATUS_SOFT.muted,
  Immunization: STATUS_SOFT.success,
};

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debouncedValue;
}

function CategoryTag({ category }) {
  const classes = CATEGORY_TAG_CLASSES[category] || 'bg-muted text-muted-foreground';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        classes
      )}
    >
      {category}
    </span>
  );
}

/** Keep in sync with backend ORDER_STATUS_VALUES (incl. Results tab updates). */
const STATUS_OPTIONS = [
  'Scheduled',
  'Pending',
  'In Progress',
  'On Hold',
  'Cancelled',
  'Completed',
  'Resulted',
];

const CATEGORY_DISPLAY_ORDER = ['Radiology', 'Lab', 'Pharmacy', 'Immunization', 'Procedures'];
const CATEGORY_HEADING_LABELS = {
  Radiology: 'Radiology',
  Lab: 'Lab',
  Pharmacy: 'Medicines',
  Immunization: 'Immunizations / Vaccines',
  Procedures: 'Procedures',
};

function formatDateTime(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export function PatientOrderEntryTab({ patientId, appointmentId }) {
  const { user } = useAuth();
  const { refreshChart, isSampleChart, setOrders: setContextOrders, orders: contextOrders } = usePatientChart();
  const [searchRaw, setSearchRaw] = useState('');
  const [orders, setOrders] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [savedOrderIdsInEdit, setSavedOrderIdsInEdit] = useState(new Set());
  const [lastSavedConsent, setLastSavedConsent] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [highlightedResultIndex, setHighlightedResultIndex] = useState(0);
  const [resultsVisible, setResultsVisible] = useState(false);
  const [customOrderSearchRaw, setCustomOrderSearchRaw] = useState('');
  const [customOrderResultsVisible, setCustomOrderResultsVisible] = useState(false);
  const [customOrderHighlightedIndex, setCustomOrderHighlightedIndex] = useState(0);
  const [customOrderSetsRefresh, setCustomOrderSetsRefresh] = useState(0);
  const [loadedFromCustomSet, setLoadedFromCustomSet] = useState(false);
  const [customSetProcedureKeys, setCustomSetProcedureKeys] = useState(() => new Set());
  const [hasExtraItemsBeyondCustomSet, setHasExtraItemsBeyondCustomSet] = useState(false);
  const [saveAsCustomOpen, setSaveAsCustomOpen] = useState(false);
  const [saveAsCustomName, setSaveAsCustomName] = useState('');
  const [saveAsCustomError, setSaveAsCustomError] = useState(null);
  const [vaccineResults, setVaccineResults] = useState([]);
  const [vaccineSearchLoading, setVaccineSearchLoading] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [radiologyStudies, setRadiologyStudies] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [medDetailOpen, setMedDetailOpen] = useState(false);
  const [medDetailMedication, setMedDetailMedication] = useState(null);
  const [medDetailOrderId, setMedDetailOrderId] = useState(null);
  const [medDetailInitial, setMedDetailInitial] = useState(null);
  const searchContainerRef = useRef(null);
  const customOrderContainerRef = useRef(null);

  const orderingDoctorName = user?.name?.trim() || user?.email || 'Logged-in user';
  const debouncedSearch = useDebounce(searchRaw.trim(), DEBOUNCE_MS);

  useEffect(() => {
    if (isSampleChart) {
      setOrders(contextOrders.map(apiOrderToRow));
      return undefined;
    }
    if (!patientId) {
      setOrders([]);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await orderApi.getOrders({
          patientId,
          appointmentId: appointmentId || undefined,
          limit: 500,
        });
        if (!cancelled) setOrders((res?.data ?? []).map(apiOrderToRow));
      } catch {
        if (!cancelled) setOrders([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patientId, appointmentId, isSampleChart, contextOrders]);

  useEffect(() => {
    if (isSampleChart) {
      setRadiologyStudies([]);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await radiologyStudyApi.getActive();
        if (!cancelled) setRadiologyStudies(res?.data ?? []);
      } catch {
        if (!cancelled) setRadiologyStudies([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSampleChart]);

  useEffect(() => {
    if (isSampleChart) {
      setLabTests([]);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await labTestApi.getActive();
        if (!cancelled) setLabTests(res?.data ?? []);
      } catch {
        if (!cancelled) setLabTests([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSampleChart]);

  useEffect(() => {
    // Always load Medication Formulary catalog for order search (all patients/departments).
    let cancelled = false;
    (async () => {
      try {
        const res = await medicationCatalogApi.searchActive({ limit: 100 });
        if (!cancelled) {
          setMedicines((Array.isArray(res?.data) ? res.data : []).map(mapMedicineToOrderItem));
        }
      } catch {
        if (!cancelled) setMedicines([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const procedures = useMemo(() => {
    if (isSampleChart) {
      const nonPharmacySample = procedureCodesData.filter((p) => p.category !== 'Pharmacy');
      return [...nonPharmacySample, ...medicines];
    }
    const staticProcedures = procedureCodesData.filter(
      (p) => p.category !== 'Radiology' && p.category !== 'Lab' && p.category !== 'Pharmacy',
    );
    const radiologyFromMaster = radiologyStudies.map((study) => ({
      id: study.id,
      code: study.code,
      name: study.name,
      category: 'Radiology',
      subcategory: study.modality,
      bodyPart: study.bodyPart,
    }));
    const labFromMaster = labTests.map((lt) => ({
      id: lt.id,
      code: lt.code,
      name: lt.name,
      category: 'Lab',
      subcategory: lt.category,
      specimenType: lt.specimenType,
    }));
    return [...staticProcedures, ...radiologyFromMaster, ...labFromMaster, ...medicines];
  }, [radiologyStudies, labTests, medicines, isSampleChart]);

  useEffect(() => {
    if (debouncedSearch.length < MIN_SEARCH_LENGTH) {
      setVaccineResults([]);
      return undefined;
    }
    let cancelled = false;
    setVaccineSearchLoading(true);
    (async () => {
      try {
        const [vaccineRes, medicineRes] = await Promise.allSettled([
          vaccineApi.getActiveForOrders({ search: debouncedSearch, limit: 25 }),
          medicationCatalogApi.searchActive({ search: debouncedSearch, limit: 50 }),
        ]);
        if (cancelled) return;
        setVaccineResults(
          vaccineRes.status === 'fulfilled' && Array.isArray(vaccineRes.value?.data)
            ? vaccineRes.value.data
            : [],
        );
        if (medicineRes.status === 'fulfilled' && Array.isArray(medicineRes.value?.data)) {
          const searched = medicineRes.value.data.map(mapMedicineToOrderItem);
          setMedicines((prev) => {
            const byId = new Map(prev.map((m) => [m.id, m]));
            searched.forEach((m) => byId.set(m.id, m));
            return Array.from(byId.values());
          });
        }
      } catch {
        if (!cancelled) setVaccineResults([]);
      } finally {
        if (!cancelled) setVaccineSearchLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  const searchResults = useMemo(() => {
    if (debouncedSearch.length < MIN_SEARCH_LENGTH) return [];
    const q = debouncedSearch.toLowerCase();
    const matchesFormulary = (p) => {
      const code = String(p.code || '').toLowerCase();
      const name = String(p.name || '').toLowerCase();
      const generic = String(p.genericName || '').toLowerCase();
      const brand = String(p.brandName || '').toLowerCase();
      const medClass = String(p.medicationClass || '').toLowerCase();
      const therapeutic = String(p.therapeuticCategory || '').toLowerCase();
      return (
        code.includes(q) ||
        name.includes(q) ||
        generic.includes(q) ||
        brand.includes(q) ||
        medClass.includes(q) ||
        therapeutic.includes(q)
      );
    };
    const procedureMatches = procedures.filter((p) => {
      if (p.category === 'Pharmacy') return matchesFormulary(p);
      const code = String(p.code || '').toLowerCase();
      const name = String(p.name || '').toLowerCase();
      return code.includes(q) || name.includes(q);
    });
    const seen = new Set(procedureMatches.map((p) => `${p.category}:${p.id || p.code}`));
    const vaccineMatches = vaccineResults.filter((v) => {
      const key = `${v.category}:${v.id || v.code}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    // Prefer formulary medicines first in results.
    const pharmacy = procedureMatches.filter((p) => p.category === 'Pharmacy');
    const other = procedureMatches.filter((p) => p.category !== 'Pharmacy');
    return [...pharmacy, ...other, ...vaccineMatches];
  }, [procedures, debouncedSearch, vaccineResults]);

  const customOrderSets = useMemo(
    () => loadCustomOrderSets(),
    [customOrderSetsRefresh]
  );
  const debouncedCustomOrderSearch = useDebounce(customOrderSearchRaw.trim(), DEBOUNCE_MS);
  const customOrderSearchResults = useMemo(() => {
    if (debouncedCustomOrderSearch.length < MIN_SEARCH_LENGTH) return [];
    const q = debouncedCustomOrderSearch.toLowerCase();
    return customOrderSets.filter((set) =>
      set.name.toLowerCase().includes(q)
    );
  }, [customOrderSets, debouncedCustomOrderSearch]);

  const ordersByCategory = useMemo(() => {
    const groups = {};
    orders.forEach((order) => {
      const cat = order.procedure.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(order);
    });
    const result = [];
    CATEGORY_DISPLAY_ORDER.forEach((cat) => {
      if (groups[cat]?.length) {
        result.push({
          category: cat,
          label: CATEGORY_HEADING_LABELS[cat] ?? cat,
          orders: groups[cat],
        });
      }
    });
    Object.keys(groups).forEach((cat) => {
      if (!CATEGORY_DISPLAY_ORDER.includes(cat)) {
        result.push({ category: cat, label: cat, orders: groups[cat] });
      }
    });
    return result;
  }, [orders]);

  const openMedicationDetail = useCallback((procedure, order = null) => {
    const medication = procedureToMedication(procedure) || procedureToMedication({
      id: procedure?.id,
      name: procedure?.name,
      code: procedure?.code,
    });
    setMedDetailMedication(medication);
    setMedDetailOrderId(order?.id || null);
    setMedDetailInitial(order?.medicationDetails || null);
    setMedDetailOpen(true);
  }, []);

  const closeMedicationDetail = useCallback(() => {
    setMedDetailOpen(false);
    setMedDetailMedication(null);
    setMedDetailOrderId(null);
    setMedDetailInitial(null);
  }, []);

  const addToOrder = useCallback((procedure) => {
    setResultsVisible(false);
    setSearchRaw('');

    // Pharmacy / medication formulary items open the detail form first.
    if (procedure?.category === 'Pharmacy') {
      openMedicationDetail(procedure, null);
      return;
    }

    const now = new Date().toISOString();
    const key = procedureKey(procedure);
    setOrders((prev) => [
      ...prev,
      {
        id: `${procedure.id}-${Date.now()}`,
        procedure,
        dateTime: now,
        status: 'Scheduled',
        orderedBy: null,
        _fromCustomSet: false,
      },
    ]);
    // Adding via Search orders after a custom set re-enables "Save as custom Order"
    setHasExtraItemsBeyondCustomSet((prev) => {
      if (!loadedFromCustomSet) return prev;
      return prev || !customSetProcedureKeys.has(key);
    });
  }, [loadedFromCustomSet, customSetProcedureKeys, openMedicationDetail]);

  const handleMedicationDetailConfirm = useCallback((details) => {
    const medication = medDetailMedication;
    if (!medication) return;

    const procedure = {
      id: medication.id,
      code: medication.code,
      name: medication.name,
      category: 'Pharmacy',
      subcategory: medication.medicationClass || medication.dosageForm,
      strength: medication.strength,
      strengthUnit: medication.strengthUnit,
      dosageForm: medication.dosageForm,
      route: medication.route,
      genericName: medication.genericName,
      brandName: medication.brandName,
      medicationClass: medication.medicationClass,
      therapeuticCategory: medication.therapeuticCategory,
      formularyStatus: medication.formularyStatus,
      formularyTier: medication.formularyTier,
      preferredDrug: medication.preferredDrug,
      defaultDose: medication.defaultDose,
      defaultDoseUnit: medication.defaultDoseUnit,
      defaultFrequency: medication.defaultFrequency,
      defaultDuration: medication.defaultDuration,
      durationUnit: medication.durationUnit,
      instructions: medication.instructions,
      ndc: medication.ndc,
      rxNorm: medication.rxNorm,
      source: 'medication-formulary',
    };

    const key = procedureKey(procedure);

    if (medDetailOrderId) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === medDetailOrderId
            ? {
                ...o,
                procedure: { ...o.procedure, ...procedure },
                medicationDetails: details,
                _medicationSigned: details.status === 'Signed',
              }
            : o,
        ),
      );
    } else {
      const now = new Date().toISOString();
      setOrders((prev) => [
        ...prev,
        {
          id: `${procedure.id}-${Date.now()}`,
          procedure,
          dateTime: now,
          status: 'Scheduled',
          orderedBy: null,
          _fromCustomSet: false,
          medicationDetails: details,
          _medicationSigned: false,
        },
      ]);
      setHasExtraItemsBeyondCustomSet((prev) => {
        if (!loadedFromCustomSet) return prev;
        return prev || !customSetProcedureKeys.has(key);
      });
    }

    closeMedicationDetail();
  }, [
    medDetailMedication,
    medDetailOrderId,
    loadedFromCustomSet,
    customSetProcedureKeys,
    closeMedicationDetail,
  ]);

  const addCustomOrderSet = useCallback((orderSet) => {
    const now = new Date().toISOString();
    const setOrdersList = orderSet.orders || [];
    const newOrders = setOrdersList.map((proc) => ({
      id: `${proc.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      procedure: proc,
      dateTime: now,
      status: 'Scheduled',
      orderedBy: null,
      _fromCustomSet: true,
    }));
    setOrders((prev) => [...prev, ...newOrders]);
    setCustomOrderResultsVisible(false);
    setCustomOrderSearchRaw('');
    setLoadedFromCustomSet(true);
    setHasExtraItemsBeyondCustomSet(false);
    setCustomSetProcedureKeys((prev) => {
      const next = new Set(prev);
      setOrdersList.forEach((proc) => next.add(procedureKey(proc)));
      return next;
    });
  }, []);

  const updateStatus = useCallback(
    async (orderId, status) => {
      const current = orders.find((o) => o.id === orderId);
      if (!current || current.status === status) return;
      const previousStatus = current.status;

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
      );
      setSaveError(null);

      if (!current._persisted) return;

      if (isSampleChart) {
        setContextOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
        );
        return;
      }

      try {
        await orderApi.updateOrderStatus(orderId, status);
        refreshChart?.();
      } catch (err) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: previousStatus } : o)),
        );
        setSaveError(err?.message || 'Failed to update order status.');
      }
    },
    [orders, isSampleChart, setContextOrders, refreshChart],
  );

  const removeOrder = useCallback((orderId) => {
    setOrders((prev) => {
      const next = prev.filter((o) => o.id !== orderId);
      const unsaved = next.filter((o) => !o._persisted);
      if (unsaved.length === 0) {
        setLoadedFromCustomSet(false);
        setCustomSetProcedureKeys(new Set());
        setHasExtraItemsBeyondCustomSet(false);
      } else if (loadedFromCustomSet) {
        const hasExtra = unsaved.some(
          (o) => !o._fromCustomSet || !customSetProcedureKeys.has(procedureKey(o.procedure)),
        );
        setHasExtraItemsBeyondCustomSet(hasExtra);
      }
      return next;
    });
  }, [loadedFromCustomSet, customSetProcedureKeys]);

  const unsavedOrdersForCustomSet = useMemo(
    () => orders.filter((o) => !o._persisted),
    [orders],
  );

  const canSaveAsCustomOrder = useMemo(() => {
    if (unsavedOrdersForCustomSet.length === 0) return false;
    // Search-orders path: always allow saving as a new custom order set
    if (!loadedFromCustomSet) return true;
    // Custom-order path: enable only after user adds at least one new item
    return hasExtraItemsBeyondCustomSet;
  }, [unsavedOrdersForCustomSet.length, loadedFromCustomSet, hasExtraItemsBeyondCustomSet]);

  const openSaveAsCustomDialog = useCallback(() => {
    if (!canSaveAsCustomOrder) return;
    setSaveAsCustomName('');
    setSaveAsCustomError(null);
    setSaveAsCustomOpen(true);
  }, [canSaveAsCustomOrder]);

  const handleSaveAsCustomOrder = useCallback(() => {
    const name = saveAsCustomName.trim();
    if (!name) {
      setSaveAsCustomError('Enter a name for this custom order set.');
      return;
    }
    if (unsavedOrdersForCustomSet.length === 0) {
      setSaveAsCustomError('Add at least one order before saving as a custom order set.');
      return;
    }

    const now = new Date().toISOString();
    const seen = new Set();
    const setOrdersList = [];
    unsavedOrdersForCustomSet.forEach((order) => {
      const key = procedureKey(order.procedure);
      if (!key || seen.has(key)) return;
      seen.add(key);
      setOrdersList.push({ ...order.procedure });
    });

    const existing = loadCustomOrderSets();
    const newSet = {
      id: `set-${Date.now()}`,
      name,
      orders: setOrdersList,
      createdAt: now,
      updatedAt: now,
    };
    saveCustomOrderSets([...existing, newSet]);
    setCustomOrderSetsRefresh((r) => r + 1);
    setSaveAsCustomOpen(false);
    setSaveAsCustomName('');
    setSaveAsCustomError(null);
    // After saving a new set from an amended custom set, treat as search-built again
    setLoadedFromCustomSet(false);
    setCustomSetProcedureKeys(new Set());
    setHasExtraItemsBeyondCustomSet(false);
  }, [saveAsCustomName, unsavedOrdersForCustomSet]);

  const startEditMode = useCallback(() => {
    setIsEditMode(true);
    setSavedOrderIdsInEdit(new Set(orders.map((o) => o.id)));
  }, [orders]);

  const isSavedOrder = useCallback(
    (orderId) => isEditMode && savedOrderIdsInEdit.has(orderId),
    [isEditMode, savedOrderIdsInEdit]
  );

  const handleSaveOrder = useCallback(async () => {
    setSaveError(null);
    const ordersToSave = orders.map((o) => ({ ...o, orderedBy: o.orderedBy || orderingDoctorName }));
    setOrders(ordersToSave);

    const newOrders = ordersToSave.filter((o) => !o._persisted);
    if (newOrders.length === 0) {
      setSaveError('Add at least one new order before saving.');
      return;
    }

    setSaving(true);
    try {
      if (isSampleChart) {
        const now = new Date().toISOString();
        const created = newOrders.map((o, i) => ({
          id: `ord-sample-new-${Date.now()}-${i}`,
          patientId,
          appointmentId: appointmentId || null,
          category: o.procedure?.category ?? 'Procedures',
          procedureCode: o.procedure?.code ?? o.procedure?.id ?? '',
          procedureName: o.procedure?.name ?? '',
          status: o.status ?? 'Scheduled',
          destination: 'onsite',
          orderedBy: orderingDoctorName,
          orderDateTime: now,
        }));
        setContextOrders((prev) => [...created, ...prev]);
        setOrders((prev) => [
          ...created.map(apiOrderToRow),
          ...prev.filter((o) => o._persisted),
        ]);
      } else {
        if (!patientId) {
          setSaveError('Open a patient chart (patient context required) to persist orders.');
          return;
        }

        // Pharmacy orders are synced to signed give-in-clinic medication/MAR rows on the backend.
        await orderApi.createOrders({
          patientId,
          appointmentId: appointmentId || null,
          locationId: null,
          orderedBy: orderingDoctorName,
          orders: newOrders.map((o) => ({
            procedureCode: o.procedure?.code ?? o.procedure?.id ?? '',
            procedureName: o.procedure?.name ?? '',
            category: o.procedure?.category ?? 'Procedures',
            status: o.status ?? 'Scheduled',
          })),
        });

        await refreshChart();
        try {
          const res = await orderApi.getOrders({
            patientId,
            appointmentId: appointmentId || undefined,
            limit: 500,
          });
          const detailByKey = new Map(
            newOrders
              .filter((o) => o.medicationDetails)
              .map((o) => [
                `${o.procedure?.category || ''}:${o.procedure?.code || ''}:${o.procedure?.name || ''}`,
                {
                  medicationDetails: o.medicationDetails,
                  _medicationSigned: !!o._medicationSigned,
                  procedure: o.procedure,
                },
              ]),
          );
          setOrders(
            (res?.data ?? []).map((row) => {
              const mapped = apiOrderToRow(row);
              const key = `${mapped.procedure?.category || ''}:${mapped.procedure?.code || ''}:${mapped.procedure?.name || ''}`;
              const local = detailByKey.get(key);
              if (!local) return mapped;
              return {
                ...mapped,
                procedure: { ...mapped.procedure, ...local.procedure },
                medicationDetails: local.medicationDetails,
                // Chart Save persists the order; treat as signed for eMAR sync path.
                _medicationSigned: true,
              };
            }),
          );
        } catch {
          setOrders((prev) => prev.filter((o) => o._persisted));
        }
      }
      const savedAt = new Date().toISOString();
      setLastSavedConsent({
        orderedBy: orderingDoctorName,
        savedAt,
      });
    } catch (err) {
      setSaveError(err?.message || 'Failed to save orders.');
    } finally {
      setSaving(false);
    }
  }, [orders, orderingDoctorName, patientId, appointmentId, refreshChart, isSampleChart, setContextOrders]);

  const getOrderedBy = useCallback(
    (order) => order.orderedBy || orderingDoctorName,
    [orderingDoctorName]
  );

  const onSearchKeyDown = useCallback(
    (e) => {
      if (!resultsVisible || searchResults.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedResultIndex((i) =>
          i < searchResults.length - 1 ? i + 1 : i
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedResultIndex((i) => (i > 0 ? i - 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        addToOrder(searchResults[highlightedResultIndex]);
      } else if (e.key === 'Escape') {
        setResultsVisible(false);
      }
    },
    [resultsVisible, searchResults, highlightedResultIndex, addToOrder]
  );

  useEffect(() => {
    setHighlightedResultIndex(0);
  }, [searchResults]);

  const onCustomOrderKeyDown = useCallback(
    (e) => {
      if (!customOrderResultsVisible || customOrderSearchResults.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCustomOrderHighlightedIndex((i) =>
          i < customOrderSearchResults.length - 1 ? i + 1 : i
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCustomOrderHighlightedIndex((i) => (i > 0 ? i - 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        addCustomOrderSet(customOrderSearchResults[customOrderHighlightedIndex]);
      } else if (e.key === 'Escape') {
        setCustomOrderResultsVisible(false);
      }
    },
    [customOrderResultsVisible, customOrderSearchResults, customOrderHighlightedIndex, addCustomOrderSet]
  );

  useEffect(() => {
    setCustomOrderHighlightedIndex(0);
  }, [customOrderSearchResults]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setResultsVisible(false);
      }
      if (customOrderContainerRef.current && !customOrderContainerRef.current.contains(e.target)) {
        setCustomOrderResultsVisible(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <ChartTabShell
      title="Order entry"
      description="Search procedure codes and add orders. Set date/time and status per order."
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-4">
        <div className="relative w-full sm:max-w-md flex-1 min-w-0" ref={searchContainerRef}>
          <label className="text-sm font-medium text-foreground block mb-1.5">Search orders</label>
          <div className="flex h-8 items-center gap-2 rounded-md border bg-transparent shadow-xs overflow-hidden focus-within:ring-[3px] focus-within:ring-ring/50 focus-within:border-ring">
            <span className="flex items-center justify-center pl-2.5 text-muted-foreground shrink-0" aria-hidden>
              <Search className="h-3.5 w-3.5" />
            </span>
            <Input
              placeholder="Search orders (min 2 characters)"
              value={searchRaw}
              onChange={(e) => {
                setSearchRaw(e.target.value);
                setResultsVisible(true);
              }}
              onFocus={() => searchResults.length > 0 && setResultsVisible(true)}
              onKeyDown={onSearchKeyDown}
              className="h-8 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 pl-0 pr-2.5 py-1"
            />
          </div>
          {resultsVisible && searchResults.length > 0 && (
            <ul
              className="absolute left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto rounded-md border bg-background shadow-lg z-20 py-1"
              role="listbox"
            >
              {searchResults.map((p, i) => (
                <li
                  key={p.id}
                  role="option"
                  aria-selected={highlightedResultIndex === i}
                  className={cn(
                    'flex items-center justify-between gap-2 cursor-pointer px-3 py-2 text-sm hover:bg-muted/50',
                    highlightedResultIndex === i && 'bg-muted'
                  )}
                  onClick={() => addToOrder(p)}
                >
                  <span className="font-medium">{p.name}</span>
                  <CategoryTag category={p.category} />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="relative w-full sm:max-w-md flex-1 min-w-0" ref={customOrderContainerRef}>
          <label className="text-sm font-medium text-foreground block mb-1.5">Search a custom order</label>
          <div className="flex h-8 items-center gap-2 rounded-md border bg-transparent shadow-xs overflow-hidden focus-within:ring-[3px] focus-within:ring-ring/50 focus-within:border-ring">
            <span className="flex items-center justify-center pl-2.5 text-muted-foreground shrink-0" aria-hidden>
              <Search className="h-3.5 w-3.5" />
            </span>
            <Input
              placeholder="Search custom order set (min 2 characters)"
              value={customOrderSearchRaw}
              onChange={(e) => {
                setCustomOrderSearchRaw(e.target.value);
                setCustomOrderResultsVisible(true);
              }}
              onFocus={() => {
                setCustomOrderSetsRefresh((r) => r + 1);
                if (customOrderSearchResults.length > 0) setCustomOrderResultsVisible(true);
              }}
              onKeyDown={onCustomOrderKeyDown}
              className="h-8 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 pl-0 pr-2.5 py-1"
            />
          </div>
          {customOrderResultsVisible && customOrderSearchResults.length > 0 && (
            <ul
              className="absolute left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto rounded-md border bg-background shadow-lg z-20 py-1"
              role="listbox"
            >
              {customOrderSearchResults.map((set, i) => (
                <li
                  key={set.id}
                  role="option"
                  aria-selected={customOrderHighlightedIndex === i}
                  className={cn(
                    'flex items-center justify-between gap-2 cursor-pointer px-3 py-2 text-sm hover:bg-muted/50',
                    customOrderHighlightedIndex === i && 'bg-muted'
                  )}
                  onClick={() => addCustomOrderSet(set)}
                >
                  <span className="font-medium">{set.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {set.orders?.length ?? 0} order(s)
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={openSaveAsCustomDialog}
                  disabled={!canSaveAsCustomOrder}
                  title={
                    loadedFromCustomSet && !hasExtraItemsBeyondCustomSet
                      ? 'Add a new item via Search orders to save as a new custom order set'
                      : unsavedOrdersForCustomSet.length === 0
                        ? 'Add orders via Search orders to save as a custom order set'
                        : 'Save current orders as a custom order set'
                  }
                >
                  <BookmarkPlus className="h-4 w-4 mr-2" />
                  Save as custom Order
                </Button>
                <Button onClick={handleSaveOrder} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving…' : 'Save Order'}
                </Button>
                <Button type="button" variant="outline" onClick={startEditMode}>
                  <Pencil className="h-4 w-4 mr-2 icon-action-edit" />
                  Edit order
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-6">
              {orders.length === 0 ? (
                <div className="rounded-md border py-12 text-center text-muted-foreground text-sm">
                  No orders yet.
                </div>
              ) : (
                ordersByCategory.map(({ category, label, orders: categoryOrders }) => (
                  <div key={category} className="space-y-2">
                    <h3 className={cn(
                      'text-sm font-semibold uppercase tracking-wide border-b pb-2 text-foreground',
                      category === 'Radiology' && 'border-primary',
                      category === 'Lab' && 'border-green-500',
                      category === 'Pharmacy' && 'border-purple-500',
                      category === 'Procedures' && 'border-orange-500'
                    )}>
                      {label}
                    </h3>
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order name</TableHead>
                            <TableHead>Order status</TableHead>
                            <TableHead>Order date and time</TableHead>
                            <TableHead>Ordered by</TableHead>
                            <TableHead className="min-w-[140px] text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categoryOrders.map((order) => {
                            const isPharmacy = order.procedure?.category === 'Pharmacy';
                            const showViewDetail =
                              isPharmacy &&
                              order.medicationDetails &&
                              !order._medicationSigned &&
                              order.medicationDetails.status !== 'Signed';
                            return (
                            <TableRow key={order.id}>
                              <TableCell className="font-medium">
                                <div>
                                  {order.procedure.name}
                                  {isPharmacy && order.medicationDetails?.sigPreview ? (
                                    <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                                      {HANDLING_LABELS[order.medicationDetails.handlingMethod] || 'Medication'}
                                      {' · '}
                                      {order.medicationDetails.sigPreview}
                                    </p>
                                  ) : null}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={order.status}
                                  onValueChange={(value) => updateStatus(order.id, value)}
                                >
                                  <SelectTrigger className="h-8 w-full min-w-[140px] max-w-[180px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {STATUS_OPTIONS.map((s) => (
                                      <SelectItem key={s} value={s}>
                                        {s}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {formatDateTime(order.dateTime)}
                              </TableCell>
                              <TableCell>
                                {getOrderedBy(order)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-end gap-1">
                                  {showViewDetail && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8"
                                      onClick={() =>
                                        openMedicationDetail(order.procedure, order)
                                      }
                                    >
                                      View Detail
                                    </Button>
                                  )}
                                  {!isSavedOrder(order.id) && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                      onClick={() => removeOrder(order.id)}
                                      title="Remove"
                                    >
                                      <Trash2 className="h-4 w-4 icon-action-delete" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex flex-col gap-3">
              {saveError && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {saveError}
                </div>
              )}
              {lastSavedConsent && (
                <div className="rounded-md border bg-muted/30 px-4 py-3 text-sm">
                  <p className="font-medium text-foreground">Order saved</p>
                  <p className="text-muted-foreground mt-1">
                    Ordered by (consent): <span className="font-medium text-foreground">{lastSavedConsent.orderedBy}</span>
                    {' — '}
                    {formatDateTime(lastSavedConsent.savedAt)}
                  </p>
                </div>
              )}
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={openSaveAsCustomDialog}
                  disabled={!canSaveAsCustomOrder}
                  title={
                    loadedFromCustomSet && !hasExtraItemsBeyondCustomSet
                      ? 'Add a new item via Search orders to save as a new custom order set'
                      : unsavedOrdersForCustomSet.length === 0
                        ? 'Add orders via Search orders to save as a custom order set'
                        : 'Save current orders as a custom order set'
                  }
                >
                  <BookmarkPlus className="h-4 w-4 mr-2" />
                  Save as custom Order
                </Button>
                <Button onClick={handleSaveOrder} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving…' : 'Save Order'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={saveAsCustomOpen} onOpenChange={setSaveAsCustomOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save as custom Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label
                htmlFor="save-as-custom-name"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Custom order set name
              </label>
              <Input
                id="save-as-custom-name"
                placeholder="Enter order set name"
                value={saveAsCustomName}
                onChange={(e) => {
                  setSaveAsCustomName(e.target.value);
                  setSaveAsCustomError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveAsCustomOrder();
                  }
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {unsavedOrdersForCustomSet.length} order
              {unsavedOrdersForCustomSet.length === 1 ? '' : 's'} will be saved in this set.
            </p>
            {saveAsCustomError && (
              <p className="text-sm text-destructive">{saveAsCustomError}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSaveAsCustomOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveAsCustomOrder} disabled={!saveAsCustomName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MedicationOrderDetailSidebar
        open={medDetailOpen}
        onClose={closeMedicationDetail}
        medication={medDetailMedication}
        initialDetails={medDetailInitial}
        existingOrders={orders
          .filter((o) => o.procedure?.category === 'Pharmacy' && o.medicationDetails)
          .map((o) => o.medicationDetails)}
        onConfirm={handleMedicationDetailConfirm}
      />
    </ChartTabShell>
  );
}
