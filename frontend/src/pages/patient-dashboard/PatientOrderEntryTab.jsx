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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Trash2, Save, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { orderApi, customOrderSetApi } from '@/services/api';
import { usePatientChart } from './PatientChartContext';
import { apiOrderToRow } from './patientChartUtils';
import {
  MIN_ORDER_SEARCH_LENGTH,
  ORDER_STATUSES,
  CATEGORY_DISPLAY_ORDER,
  CATEGORY_HEADING_LABELS,
  CATEGORY_DIVIDER_CLASSES,
  CATEGORY_TAG_CLASSES,
  DEFAULT_ORDER_SITES,
  SITE_PLACEHOLDER,
  NON_EDITABLE_STATUSES,
  normalizeCategory,
  orderRowKey,
  formatOrderDateTime,
  toDatetimeLocalValue,
  fromDatetimeLocalValue,
} from './orders/orderConstants';

const DEBOUNCE_MS = 300;

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debouncedValue;
}

function CategoryTag({ category }) {
  const classes = CATEGORY_TAG_CLASSES[category] || CATEGORY_TAG_CLASSES.Other;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        classes,
      )}
    >
      {CATEGORY_HEADING_LABELS[category] || category}
    </span>
  );
}

function makeDraftOrder(procedure, { orderedBy, orderedByUserId, sourceType, customOrderSetId, customOrderSetName } = {}) {
  const now = new Date().toISOString();
  return {
    id: `draft-${procedure.id || procedure.code}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    procedure: {
      id: procedure.id,
      code: procedure.code || procedure.procedureCode,
      name: procedure.name || procedure.procedureName,
      category: normalizeCategory(procedure.category),
    },
    dateTime: now,
    status: 'Scheduled',
    siteId: '',
    siteName: '',
    site: '',
    orderedBy: orderedBy || null,
    orderedByUserId: orderedByUserId || null,
    sourceType: sourceType || 'Individual Order',
    customOrderSetId: customOrderSetId || null,
    customOrderSetName: customOrderSetName || null,
    _persisted: false,
  };
}

export function PatientOrderEntryTab({ patientId, appointmentId }) {
  const { user } = useAuth();
  const { refreshChart, isSampleChart, setOrders: setContextOrders, orders: contextOrders, patient } = usePatientChart();
  const [searchRaw, setSearchRaw] = useState('');
  const [orders, setOrders] = useState([]);
  const [siteOptions, setSiteOptions] = useState(DEFAULT_ORDER_SITES);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [customOrderResults, setCustomOrderResults] = useState([]);
  const [customOrderLoading, setCustomOrderLoading] = useState(false);
  const [highlightedResultIndex, setHighlightedResultIndex] = useState(0);
  const [resultsVisible, setResultsVisible] = useState(false);
  const [customOrderSearchRaw, setCustomOrderSearchRaw] = useState('');
  const [customOrderResultsVisible, setCustomOrderResultsVisible] = useState(false);
  const [customOrderHighlightedIndex, setCustomOrderHighlightedIndex] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const searchContainerRef = useRef(null);
  const customOrderContainerRef = useRef(null);

  const orderingDoctorName = user?.name?.trim() || user?.email || 'Logged-in user';
  const debouncedSearch = useDebounce(searchRaw.trim(), DEBOUNCE_MS);
  const debouncedCustomOrderSearch = useDebounce(customOrderSearchRaw.trim(), DEBOUNCE_MS);

  useEffect(() => {
    orderApi.getSites().then((res) => {
      if (res?.data?.length) setSiteOptions(res.data);
    }).catch(() => {});
  }, []);

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
          limit: 200,
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
    if (debouncedSearch.length < MIN_ORDER_SEARCH_LENGTH) {
      setSearchResults([]);
      return undefined;
    }
    let cancelled = false;
    setSearchLoading(true);
    (async () => {
      try {
        const res = await orderApi.searchProcedures({ q: debouncedSearch });
        if (!cancelled) setSearchResults(res?.data ?? []);
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  useEffect(() => {
    if (debouncedCustomOrderSearch.length < MIN_ORDER_SEARCH_LENGTH) {
      setCustomOrderResults([]);
      return undefined;
    }
    let cancelled = false;
    setCustomOrderLoading(true);
    (async () => {
      try {
        const res = await customOrderSetApi.search({ q: debouncedCustomOrderSearch });
        if (!cancelled) setCustomOrderResults(res?.data ?? []);
      } catch {
        if (!cancelled) setCustomOrderResults([]);
      } finally {
        if (!cancelled) setCustomOrderLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedCustomOrderSearch]);

  const existingKeys = useMemo(() => new Set(orders.map(orderRowKey)), [orders]);

  const ordersByCategory = useMemo(() => {
    const groups = {};
    orders.forEach((order) => {
      const cat = normalizeCategory(order.procedure.category || 'Other');
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

  const addToOrder = useCallback(
    (procedure) => {
      const key = `${procedure.code || procedure.procedureCode}::${procedure.name || procedure.procedureName}`.toLowerCase();
      if (existingKeys.has(key)) {
        setInfoMessage('This order already exists in the current order list.');
        return;
      }
      setInfoMessage(null);
      setOrders((prev) => [
        ...prev,
        makeDraftOrder(procedure, {
          orderedBy: orderingDoctorName,
          orderedByUserId: user?.id,
          sourceType: 'Individual Order',
        }),
      ]);
      setResultsVisible(false);
      setSearchRaw('');
    },
    [existingKeys, orderingDoctorName, user?.id],
  );

  const addCustomOrderSet = useCallback(
    async (orderSet) => {
      setInfoMessage(null);
      let setData = orderSet;
      if (!orderSet.items?.length && !orderSet.orders?.length) {
        try {
          const res = await customOrderSetApi.getById(orderSet.id);
          setData = res?.data || orderSet;
        } catch {
          setSaveError('Failed to load custom order set.');
          return;
        }
      }

      const items = (setData.items || setData.orders || []).filter((i) => i.isActive !== false);
      const skippedInactive = (setData.items || setData.orders || []).length - items.length;
      const newOrders = [];
      const duplicates = [];

      items.forEach((item) => {
        const proc = {
          id: item.procedureId || item.id,
          code: item.procedureCode || item.code,
          name: item.procedureName || item.name,
          category: item.category,
        };
        const key = `${proc.code}::${proc.name}`.toLowerCase();
        if (existingKeys.has(key) || newOrders.some((o) => orderRowKey(o) === key)) {
          duplicates.push(proc.name);
          return;
        }
        newOrders.push(
          makeDraftOrder(proc, {
            orderedBy: orderingDoctorName,
            orderedByUserId: user?.id,
            sourceType: 'Custom Order Set',
            customOrderSetId: setData.id,
            customOrderSetName: setData.name,
          }),
        );
      });

      if (duplicates.length) {
        setInfoMessage('This order already exists in the current order list.');
      }
      if (skippedInactive > 0) {
        setInfoMessage((prev) =>
          prev
            ? `${prev} Some inactive orders were skipped.`
            : 'Some inactive orders were skipped.',
        );
      }
      if (newOrders.length) {
        setOrders((prev) => [...prev, ...newOrders]);
      }
      setCustomOrderResultsVisible(false);
      setCustomOrderSearchRaw('');
    },
    [existingKeys, orderingDoctorName, user?.id],
  );

  const updateStatus = useCallback((orderId, status) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
  }, []);

  const updateSite = useCallback((orderId, siteId) => {
    const match = siteOptions.find((s) => s.id === siteId);
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              siteId: siteId === SITE_PLACEHOLDER ? '' : siteId,
              siteName: match?.name || '',
              site: siteId === SITE_PLACEHOLDER ? '' : siteId,
            }
          : o,
      ),
    );
  }, [siteOptions]);

  const updateDateTime = useCallback((orderId, value) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, dateTime: fromDatetimeLocalValue(value) || o.dateTime } : o,
      ),
    );
  }, []);

  const removeOrder = useCallback((orderId) => {
    const order = orders.find((o) => o.id === orderId);
    if (order?._persisted) {
      setDeleteTarget(order);
      return;
    }
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  }, [orders]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    if (isSampleChart) {
      setOrders((prev) => prev.filter((o) => o.id !== deleteTarget.id));
      setDeleteTarget(null);
      return;
    }
    try {
      await orderApi.deleteOrder(deleteTarget.id);
      setOrders((prev) => prev.filter((o) => o.id !== deleteTarget.id));
      await refreshChart();
      setSaveSuccess('Order deleted.');
    } catch (err) {
      setSaveError(err?.message || 'Failed to delete order.');
    } finally {
      setDeleteTarget(null);
    }
  }, [deleteTarget, isSampleChart, refreshChart]);

  const startEditMode = useCallback(() => {
    setIsEditMode(true);
    setSaveError(null);
    setSaveSuccess(null);
  }, []);

  const cancelEditMode = useCallback(() => {
    setIsEditMode(false);
  }, []);

  const isFieldEditable = useCallback(
    (order) => {
      if (!order._persisted) return true;
      if (!isEditMode) return false;
      return !NON_EDITABLE_STATUSES.includes(order.status);
    },
    [isEditMode],
  );

  const handleSaveOrder = useCallback(async () => {
    setSaveError(null);
    setSaveSuccess(null);
    setInfoMessage(null);

    if (!orders.length) {
      setSaveError('Add at least one order before saving.');
      return;
    }

    const missingSite = orders.find((o) => !o.siteId && !o.siteName);
    if (missingSite) {
      setSaveError(`Select a site for "${missingSite.procedure.name}" before saving.`);
      return;
    }

    setSaving(true);
    try {
      const newOrders = orders.filter((o) => !o._persisted);
      const editedOrders = isEditMode ? orders.filter((o) => o._persisted) : [];

      if (isSampleChart) {
        if (newOrders.length) {
          const now = new Date().toISOString();
          const created = newOrders.map((o, i) => ({
            id: `ord-sample-new-${Date.now()}-${i}`,
            patientId,
            appointmentId: appointmentId || null,
            category: o.procedure?.category ?? 'Other',
            procedureCode: o.procedure?.code ?? '',
            procedureName: o.procedure?.name ?? '',
            status: o.status ?? 'Scheduled',
            destination: 'onsite',
            orderedBy: orderingDoctorName,
            orderDateTime: o.dateTime || now,
            siteId: o.siteId,
            siteName: o.siteName,
          }));
          setContextOrders((prev) => [...created, ...prev]);
        }
        setSaveSuccess('Orders saved successfully.');
        setIsEditMode(false);
        return;
      }

      if (!newOrders.length && !editedOrders.length) {
        setSaveError('No new or modified orders to save.');
        return;
      }

      if (!patientId) {
        setSaveError('Open a patient chart (patient context required) to persist orders.');
        return;
      }

      if (newOrders.length) {
        await orderApi.createOrders({
          patientId,
          appointmentId: appointmentId || null,
          locationId: null,
          orderedBy: orderingDoctorName,
          orders: newOrders.map((o) => ({
            procedureCode: o.procedure?.code ?? '',
            procedureName: o.procedure?.name ?? '',
            category: normalizeCategory(o.procedure?.category) ?? 'Other',
            orderType: o.procedure?.category,
            status: o.status ?? 'Scheduled',
            siteId: o.siteId || null,
            siteName: o.siteName || null,
            site: o.siteName || o.siteId || null,
            orderDateTime: o.dateTime,
            sourceType: o.sourceType || 'Individual Order',
            customOrderSetId: o.customOrderSetId || null,
            customOrderSetName: o.customOrderSetName || null,
          })),
        });
      }

      if (editedOrders.length) {
        await orderApi.updateOrders(
          editedOrders.map((o) => ({
            id: o.id,
            status: o.status,
            siteId: o.siteId || null,
            siteName: o.siteName || null,
            site: o.siteName || o.siteId || null,
            orderDateTime: o.dateTime,
          })),
        );
      }

      await refreshChart();
      const res = await orderApi.getOrders({
        patientId,
        appointmentId: appointmentId || undefined,
        limit: 200,
      });
      setOrders((res?.data ?? []).map(apiOrderToRow));
      setSaveSuccess('Orders saved successfully.');
      setIsEditMode(false);
    } catch (err) {
      setSaveError(err?.message || 'Failed to save orders.');
    } finally {
      setSaving(false);
    }
  }, [orders, orderingDoctorName, patientId, appointmentId, refreshChart, isSampleChart, setContextOrders, isEditMode]);

  const onSearchKeyDown = useCallback(
    (e) => {
      if (!resultsVisible || searchResults.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedResultIndex((i) => (i < searchResults.length - 1 ? i + 1 : i));
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
    [resultsVisible, searchResults, highlightedResultIndex, addToOrder],
  );

  useEffect(() => {
    setHighlightedResultIndex(0);
  }, [searchResults]);

  const onCustomOrderKeyDown = useCallback(
    (e) => {
      if (!customOrderResultsVisible || customOrderResults.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCustomOrderHighlightedIndex((i) =>
          i < customOrderResults.length - 1 ? i + 1 : i,
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCustomOrderHighlightedIndex((i) => (i > 0 ? i - 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        addCustomOrderSet(customOrderResults[customOrderHighlightedIndex]);
      } else if (e.key === 'Escape') {
        setCustomOrderResultsVisible(false);
      }
    },
    [customOrderResultsVisible, customOrderResults, customOrderHighlightedIndex, addCustomOrderSet],
  );

  useEffect(() => {
    setCustomOrderHighlightedIndex(0);
  }, [customOrderResults]);

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

  const showOrderSearchDropdown =
    resultsVisible && debouncedSearch.length >= MIN_ORDER_SEARCH_LENGTH;
  const showCustomSearchDropdown =
    customOrderResultsVisible && debouncedCustomOrderSearch.length >= MIN_ORDER_SEARCH_LENGTH;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Patient Order Entry</h1>
      <p className="text-muted-foreground text-sm">
        Search procedure codes and add orders. Set date/time and status per order.
      </p>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-4">
        <div className="relative w-full sm:max-w-md flex-1 min-w-0" ref={searchContainerRef}>
          <label className="text-sm font-medium text-foreground block mb-1.5">Search orders</label>
          <div className="flex h-10 items-center gap-2 rounded-md border bg-transparent shadow-xs overflow-hidden focus-within:ring-[3px] focus-within:ring-ring/50 focus-within:border-ring">
            <span className="flex items-center justify-center pl-3 text-muted-foreground shrink-0" aria-hidden>
              <Search className="h-4 w-4" />
            </span>
            <Input
              placeholder="Search orders (min 2 characters)"
              value={searchRaw}
              onChange={(e) => {
                setSearchRaw(e.target.value);
                setResultsVisible(true);
              }}
              onFocus={() => setResultsVisible(true)}
              onKeyDown={onSearchKeyDown}
              className="h-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 pl-0 pr-3 py-2"
            />
          </div>
          {showOrderSearchDropdown && (
            <ul
              className="absolute left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto rounded-md border bg-background shadow-lg z-20 py-1"
              role="listbox"
            >
              {searchLoading && (
                <li className="px-3 py-2 text-sm text-muted-foreground">Searching…</li>
              )}
              {!searchLoading && searchResults.length === 0 && (
                <li className="px-3 py-2 text-sm text-muted-foreground">No order found.</li>
              )}
              {searchResults.map((p, i) => (
                <li
                  key={p.id}
                  role="option"
                  aria-selected={highlightedResultIndex === i}
                  className={cn(
                    'flex items-center justify-between gap-2 cursor-pointer px-3 py-2 text-sm hover:bg-muted/50',
                    highlightedResultIndex === i && 'bg-muted',
                  )}
                  onClick={() => addToOrder(p)}
                >
                  <div className="min-w-0">
                    <span className="font-medium block truncate">{p.name}</span>
                    {p.cptCode && (
                      <span className="text-xs text-muted-foreground">CPT: {p.cptCode}</span>
                    )}
                  </div>
                  <CategoryTag category={p.category} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="relative w-full sm:max-w-md flex-1 min-w-0" ref={customOrderContainerRef}>
          <label className="text-sm font-medium text-foreground block mb-1.5">Search a custom order</label>
          <div className="flex h-10 items-center gap-2 rounded-md border bg-transparent shadow-xs overflow-hidden focus-within:ring-[3px] focus-within:ring-ring/50 focus-within:border-ring">
            <span className="flex items-center justify-center pl-3 text-muted-foreground shrink-0" aria-hidden>
              <Search className="h-4 w-4" />
            </span>
            <Input
              placeholder="Search custom order set (min 2 characters)"
              value={customOrderSearchRaw}
              onChange={(e) => {
                setCustomOrderSearchRaw(e.target.value);
                setCustomOrderResultsVisible(true);
              }}
              onFocus={() => setCustomOrderResultsVisible(true)}
              onKeyDown={onCustomOrderKeyDown}
              className="h-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 pl-0 pr-3 py-2"
            />
          </div>
          {showCustomSearchDropdown && (
            <ul
              className="absolute left-0 right-0 top-full mt-1 max-h-64 overflow-y-auto rounded-md border bg-background shadow-lg z-20 py-1"
              role="listbox"
            >
              {customOrderLoading && (
                <li className="px-3 py-2 text-sm text-muted-foreground">Searching…</li>
              )}
              {!customOrderLoading && customOrderResults.length === 0 && (
                <li className="px-3 py-2 text-sm text-muted-foreground">No custom order set found.</li>
              )}
              {customOrderResults.map((set, i) => (
                <li
                  key={set.id}
                  role="option"
                  aria-selected={customOrderHighlightedIndex === i}
                  className={cn(
                    'cursor-pointer px-3 py-2 text-sm hover:bg-muted/50',
                    customOrderHighlightedIndex === i && 'bg-muted',
                  )}
                  onClick={() => addCustomOrderSet(set)}
                >
                  <span className="font-medium block">{set.name}</span>
                  <span className="text-xs text-muted-foreground block mt-0.5">
                    {set.category ? `Category: ${set.category}` : null}
                    {set.category && set.orderCount != null ? ' · ' : null}
                    {set.orderCount != null ? `Orders: ${set.orderCount}` : null}
                  </span>
                  {set.createdByName && (
                    <span className="text-xs text-muted-foreground block">
                      Created By: {set.createdByName}
                      {set.departmentName ? ` · ${set.departmentName}` : ''}
                    </span>
                  )}
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
              <div className="flex items-center gap-2 shrink-0">
                <Button onClick={handleSaveOrder} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving…' : 'Save Order'}
                </Button>
                {isEditMode ? (
                  <Button type="button" variant="outline" onClick={cancelEditMode}>
                    Cancel Edit
                  </Button>
                ) : (
                  <Button type="button" variant="outline" onClick={startEditMode}>
                    <Pencil className="h-4 w-4 mr-2 icon-action-edit" />
                    Edit Order
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {infoMessage && (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
                {infoMessage}
              </div>
            )}

            <div className="space-y-6">
              {orders.length === 0 ? (
                <div className="rounded-md border py-12 text-center text-muted-foreground text-sm">
                  No orders added yet. Search an order or custom order set to begin.
                </div>
              ) : (
                ordersByCategory.map(({ category, label, orders: categoryOrders }) => (
                  <div key={category} className="space-y-2">
                    <h3
                      className={cn(
                        'text-sm font-semibold uppercase tracking-wide border-b-2 pb-2 text-foreground',
                        CATEGORY_DIVIDER_CLASSES[category] || CATEGORY_DIVIDER_CLASSES.Other,
                      )}
                    >
                      {label}
                    </h3>
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order name</TableHead>
                            <TableHead>Order status</TableHead>
                            <TableHead>Site</TableHead>
                            <TableHead>Order date and time</TableHead>
                            <TableHead>Ordered by</TableHead>
                            <TableHead className="w-10" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categoryOrders.map((order) => {
                            const editable = isFieldEditable(order);
                            const siteValue = order.siteId || SITE_PLACEHOLDER;
                            return (
                              <TableRow key={order.id}>
                                <TableCell className="font-medium">{order.procedure.name}</TableCell>
                                <TableCell>
                                  <Select
                                    value={order.status}
                                    onValueChange={(value) => updateStatus(order.id, value)}
                                    disabled={!editable}
                                  >
                                    <SelectTrigger className="h-8 w-full min-w-[140px] max-w-[180px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {ORDER_STATUSES.map((s) => (
                                        <SelectItem key={s} value={s}>
                                          {s}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={siteValue}
                                    onValueChange={(value) => updateSite(order.id, value)}
                                    disabled={!editable}
                                  >
                                    <SelectTrigger className="h-8 w-full min-w-[140px] max-w-[180px]">
                                      <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value={SITE_PLACEHOLDER}>Select</SelectItem>
                                      {siteOptions.map((opt) => (
                                        <SelectItem key={opt.id} value={opt.id}>
                                          {opt.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {(editable && isEditMode) || !order._persisted ? (
                                    <Input
                                      type="datetime-local"
                                      className="h-8 w-full min-w-[180px]"
                                      value={toDatetimeLocalValue(order.dateTime)}
                                      onChange={(e) => updateDateTime(order.id, e.target.value)}
                                      disabled={order._persisted && !isEditMode}
                                    />
                                  ) : (
                                    formatOrderDateTime(order.dateTime)
                                  )}
                                </TableCell>
                                <TableCell>
                                  {order.orderedBy || orderingDoctorName}
                                </TableCell>
                                <TableCell>
                                  {(editable || !order._persisted) && (
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
              {saveSuccess && (
                <div className="rounded-md border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-800 dark:text-green-300">
                  {saveSuccess}
                  {patient?.mrn ? (
                    <span className="block text-xs mt-1 text-muted-foreground">
                      Linked to patient MRN: {patient.mrn}
                    </span>
                  ) : null}
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={handleSaveOrder} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving…' : 'Save Order'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete saved order?</DialogTitle>
            <DialogDescription>
              This will remove &quot;{deleteTarget?.procedure?.name}&quot; from the patient chart.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
