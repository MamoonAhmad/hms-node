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
import { Search, Trash2, Save, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import procedureCodesData from '@/data/procedureCodes.json';
import { useAuth } from '@/contexts/AuthContext';
import { orderApi } from '@/services/api';

const MIN_SEARCH_LENGTH = 2;
const DEBOUNCE_MS = 300;
const CUSTOM_ORDER_SETS_STORAGE_KEY = 'hms-custom-order-sets';

function loadCustomOrderSets() {
  try {
    const raw = localStorage.getItem(CUSTOM_ORDER_SETS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const CATEGORY_TAG_CLASSES = {
  Radiology: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary border-primary/30 dark:border-primary/50',
  Lab: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800',
  Pharmacy: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  Procedures: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800',
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

const STATUS_OPTIONS = ['Scheduled', 'Discontinue', 'Cancelled', 'Completed'];

const SITE_PLACEHOLDER = 'select';
const SITE_OPTIONS = [
  { value: SITE_PLACEHOLDER, label: 'Select' },
  { value: 'onsite', label: 'Onsite' },
  { value: 'sendout', label: 'Send out' },
];

const CATEGORY_DISPLAY_ORDER = ['Radiology', 'Lab', 'Pharmacy', 'Procedures'];
const CATEGORY_HEADING_LABELS = {
  Radiology: 'Radiology',
  Lab: 'Lab',
  Pharmacy: 'Medicines',
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
  const searchContainerRef = useRef(null);
  const customOrderContainerRef = useRef(null);

  const orderingDoctorName = user?.name?.trim() || user?.email || 'Logged-in user';
  const debouncedSearch = useDebounce(searchRaw.trim(), DEBOUNCE_MS);
  const procedures = useMemo(() => procedureCodesData, []);

  const searchResults = useMemo(() => {
    if (debouncedSearch.length < MIN_SEARCH_LENGTH) return [];
    const q = debouncedSearch.toLowerCase();
    return procedures.filter(
      (p) =>
        p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
    );
  }, [procedures, debouncedSearch]);

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

  const addToOrder = useCallback((procedure) => {
    const now = new Date().toISOString();
    setOrders((prev) => [
      ...prev,
      { id: `${procedure.id}-${Date.now()}`, procedure, dateTime: now, status: 'Scheduled', site: '', orderedBy: null },
    ]);
    setResultsVisible(false);
    setSearchRaw('');
  }, []);

  const addCustomOrderSet = useCallback((orderSet) => {
    const now = new Date().toISOString();
    const newOrders = (orderSet.orders || []).map((proc) => ({
      id: `${proc.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      procedure: proc,
      dateTime: now,
      status: 'Scheduled',
      site: '',
      orderedBy: null,
    }));
    setOrders((prev) => [...prev, ...newOrders]);
    setCustomOrderResultsVisible(false);
    setCustomOrderSearchRaw('');
  }, []);

  const updateStatus = useCallback((orderId, status) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  }, []);

  const updateSite = useCallback((orderId, site) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, site } : o))
    );
  }, []);

  const removeOrder = useCallback((orderId) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  }, []);

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

    if (!patientId) {
      setSaveError('Open a patient chart (patient context required) to persist orders.');
      return;
    }
    if (ordersToSave.length === 0) {
      setSaveError('Add at least one order before saving.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        patientId,
        appointmentId: appointmentId || null,
        locationId: null,
        orderedBy: orderingDoctorName,
        orders: ordersToSave.map((o) => ({
          procedureCode: o.procedure?.code ?? o.procedure?.id ?? '',
          procedureName: o.procedure?.name ?? '',
          category: o.procedure?.category ?? 'Procedures',
          status: o.status ?? 'Scheduled',
          site: o.site ?? '',
        })),
      };
      await orderApi.createOrders(payload);
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
  }, [orders, orderingDoctorName, patientId, appointmentId]);

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
              onFocus={() => searchResults.length > 0 && setResultsVisible(true)}
              onKeyDown={onSearchKeyDown}
              className="h-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 pl-0 pr-3 py-2"
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
              onFocus={() => {
                setCustomOrderSetsRefresh((r) => r + 1);
                if (customOrderSearchResults.length > 0) setCustomOrderResultsVisible(true);
              }}
              onKeyDown={onCustomOrderKeyDown}
              className="h-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 pl-0 pr-3 py-2"
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
              <div className="flex items-center gap-2 shrink-0">
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
                            <TableHead>Site</TableHead>
                            <TableHead>Order date and time</TableHead>
                            <TableHead>Ordered by</TableHead>
                            <TableHead className="w-10" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categoryOrders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-medium">
                                {order.procedure.name}
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
                              <TableCell>
                                <Select
                                  value={order.site && order.site !== '' ? order.site : SITE_PLACEHOLDER}
                                  onValueChange={(value) => updateSite(order.id, value === SITE_PLACEHOLDER ? '' : value)}
                                >
                                  <SelectTrigger className="h-8 w-full min-w-[120px] max-w-[160px]">
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {SITE_OPTIONS.map((opt) => (
                                      <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
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
                              </TableCell>
                            </TableRow>
                          ))}
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
    </div>
  );
}
