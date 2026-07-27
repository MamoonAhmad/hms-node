import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Search, Trash2, Plus, Eye, Pencil, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  labTestApi,
  radiologyStudyApi,
  medicationCatalogApi,
} from '@/services/api';

const MIN_SEARCH_LENGTH = 2;
const DEBOUNCE_MS = 300;

const CATEGORY_TAG_CLASSES = {
  Radiology: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary border-primary/30 dark:border-primary/50',
  Lab: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800',
  Pharmacy: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
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
        classes,
      )}
    >
      {category}
    </span>
  );
}

function formatDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString(undefined, {
    dateStyle: 'short',
  });
}

function mapMedicineToOrderItem(med) {
  const strengthLabel = [med.strength, med.strengthUnit].filter(Boolean).join(' ').trim();
  const baseName = med.name || med.genericName || med.brandName || 'Medication';
  const name =
    strengthLabel && !String(baseName).toLowerCase().includes(String(med.strength || '').toLowerCase())
      ? `${baseName} ${strengthLabel}`
      : baseName;
  return {
    id: `pharmacy:${med.id}`,
    sourceId: med.id,
    code: med.code || med.ndc || med.id,
    name,
    category: 'Pharmacy',
    subcategory: med.medicationClass || med.dosageForm || undefined,
    genericName: med.genericName,
    brandName: med.brandName,
  };
}

function mapLabToOrderItem(lt) {
  return {
    id: `lab:${lt.id}`,
    sourceId: lt.id,
    code: lt.code,
    name: lt.name,
    category: 'Lab',
    subcategory: lt.category,
    specimenType: lt.specimenType,
  };
}

function mapRadiologyToOrderItem(study) {
  return {
    id: `radiology:${study.id}`,
    sourceId: study.id,
    code: study.code,
    name: study.name,
    category: 'Radiology',
    subcategory: study.modality,
    bodyPart: study.bodyPart,
  };
}

function matchesSearch(item, q) {
  const code = String(item.code || '').toLowerCase();
  const name = String(item.name || '').toLowerCase();
  const generic = String(item.genericName || '').toLowerCase();
  const brand = String(item.brandName || '').toLowerCase();
  const subcategory = String(item.subcategory || '').toLowerCase();
  return (
    code.includes(q) ||
    name.includes(q) ||
    generic.includes(q) ||
    brand.includes(q) ||
    subcategory.includes(q)
  );
}

// Persist order sets in localStorage for demo (key used by this page)
const STORAGE_KEY = 'hms-custom-order-sets';

function loadOrderSets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveOrderSets(sets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
}

export function CustomOrderSetPage() {
  const [orderSets, setOrderSets] = useState(loadOrderSets);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingSet, setViewingSet] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [formName, setFormName] = useState('');
  const [formOrders, setFormOrders] = useState([]);
  const [searchRaw, setSearchRaw] = useState('');
  const [resultsVisible, setResultsVisible] = useState(false);
  const [highlightedResultIndex, setHighlightedResultIndex] = useState(0);
  const searchContainerRef = useRef(null);

  const [catalogItems, setCatalogItems] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState(null);
  const [medicineSearchLoading, setMedicineSearchLoading] = useState(false);

  const debouncedSearch = useDebounce(searchRaw.trim(), DEBOUNCE_MS);

  useEffect(() => {
    if (!addModalOpen) return undefined;

    let cancelled = false;
    setCatalogLoading(true);
    setCatalogError(null);

    (async () => {
      try {
        const [medRes, labRes, radRes] = await Promise.allSettled([
          medicationCatalogApi.searchActive({ limit: 200 }),
          labTestApi.getActive(),
          radiologyStudyApi.getActive(),
        ]);

        if (cancelled) return;

        const medicines =
          medRes.status === 'fulfilled' && Array.isArray(medRes.value?.data)
            ? medRes.value.data.map(mapMedicineToOrderItem)
            : [];
        const labs =
          labRes.status === 'fulfilled' && Array.isArray(labRes.value?.data)
            ? labRes.value.data.map(mapLabToOrderItem)
            : [];
        const radiology =
          radRes.status === 'fulfilled' && Array.isArray(radRes.value?.data)
            ? radRes.value.data.map(mapRadiologyToOrderItem)
            : [];

        setCatalogItems([...radiology, ...labs, ...medicines]);

        const failed = [medRes, labRes, radRes].filter((r) => r.status === 'rejected');
        if (failed.length === 3) {
          setCatalogError('Failed to load medicine, lab, and radiology masters.');
        } else if (failed.length > 0) {
          setCatalogError('Some catalogs failed to load. Search results may be incomplete.');
        }
      } catch (err) {
        if (!cancelled) {
          setCatalogItems([]);
          setCatalogError(err.message || 'Failed to load order catalogs.');
        }
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [addModalOpen]);

  // Live medicine search as the user types (catalog can be large)
  useEffect(() => {
    if (!addModalOpen || debouncedSearch.length < MIN_SEARCH_LENGTH) {
      setMedicineSearchLoading(false);
      return undefined;
    }

    let cancelled = false;
    setMedicineSearchLoading(true);

    (async () => {
      try {
        const res = await medicationCatalogApi.searchActive({
          search: debouncedSearch,
          limit: 40,
        });
        if (cancelled) return;
        const searched = (Array.isArray(res?.data) ? res.data : []).map(mapMedicineToOrderItem);
        setCatalogItems((prev) => {
          const byId = new Map(prev.map((item) => [item.id, item]));
          searched.forEach((item) => byId.set(item.id, item));
          return Array.from(byId.values());
        });
      } catch {
        // Keep existing catalog items on search failure
      } finally {
        if (!cancelled) setMedicineSearchLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [addModalOpen, debouncedSearch]);

  const searchResults = useMemo(() => {
    if (debouncedSearch.length < MIN_SEARCH_LENGTH) return [];
    const q = debouncedSearch.toLowerCase();
    const addedIds = new Set(formOrders.map((o) => o.id));
    return catalogItems.filter((item) => !addedIds.has(item.id) && matchesSearch(item, q));
  }, [catalogItems, debouncedSearch, formOrders]);

  const openAddModal = useCallback(() => {
    setEditingId(null);
    setFormName('');
    setFormOrders([]);
    setSearchRaw('');
    setResultsVisible(false);
    setCatalogError(null);
    setAddModalOpen(true);
  }, []);

  const openEditModal = useCallback((set) => {
    setEditingId(set.id);
    setFormName(set.name);
    setFormOrders(set.orders.map((o) => ({ ...o })));
    setSearchRaw('');
    setResultsVisible(false);
    setCatalogError(null);
    setAddModalOpen(true);
  }, []);

  const openViewModal = useCallback((set) => {
    setViewingSet(set);
    setViewModalOpen(true);
  }, []);

  const closeAddModal = useCallback(() => {
    setAddModalOpen(false);
    setEditingId(null);
    setFormName('');
    setFormOrders([]);
    setSearchRaw('');
    setResultsVisible(false);
  }, []);

  const addOrderToForm = useCallback((order) => {
    setFormOrders((prev) => [...prev, { ...order }]);
    setSearchRaw('');
    setResultsVisible(false);
  }, []);

  const removeOrderFromForm = useCallback((orderId) => {
    setFormOrders((prev) => prev.filter((o) => o.id !== orderId));
  }, []);

  const handleSaveOrderSet = useCallback(() => {
    const name = formName.trim();
    if (!name) return;
    const now = new Date().toISOString();
    if (editingId) {
      setOrderSets((prev) => {
        const next = prev.map((s) =>
          s.id === editingId
            ? {
                ...s,
                name,
                orders: [...formOrders],
                updatedAt: now,
              }
            : s,
        );
        saveOrderSets(next);
        return next;
      });
    } else {
      const newSet = {
        id: `set-${Date.now()}`,
        name,
        orders: [...formOrders],
        createdAt: now,
        updatedAt: now,
      };
      setOrderSets((prev) => {
        const next = [...prev, newSet];
        saveOrderSets(next);
        return next;
      });
    }
    closeAddModal();
  }, [formName, formOrders, editingId, closeAddModal]);

  const handleDelete = useCallback(
    (id) => {
      if (!window.confirm('Delete this order set?')) return;
      setOrderSets((prev) => {
        const next = prev.filter((s) => s.id !== id);
        saveOrderSets(next);
        return next;
      });
      if (viewingSet?.id === id) setViewModalOpen(false);
    },
    [viewingSet?.id],
  );

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
        addOrderToForm(searchResults[highlightedResultIndex]);
      } else if (e.key === 'Escape') {
        setResultsVisible(false);
      }
    },
    [resultsVisible, searchResults, highlightedResultIndex, addOrderToForm],
  );

  useEffect(() => {
    setHighlightedResultIndex(0);
  }, [searchResults]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setResultsVisible(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Custom Order Set</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create and manage custom order sets. Add multiple orders to a set for quick use.
          </p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="h-4 w-4 mr-2" />
          Add Custom Order Set
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order sets</CardTitle>
        </CardHeader>
        <CardContent>
          {orderSets.length === 0 ? (
            <div className="rounded-md border border-dashed py-12 text-center text-muted-foreground text-sm">
              No order sets yet. Click &quot;Add Custom Order Set&quot; to create one.
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Order set name</TableHead>
                    <TableHead>Created date</TableHead>
                    <TableHead>Updated date</TableHead>
                    <TableHead className="text-right w-[180px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderSets.map((set, index) => (
                    <TableRow key={set.id}>
                      <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-medium">{set.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(set.createdAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(set.updatedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openViewModal(set)}
                            title="View"
                          >
                            <Eye className="h-4 w-4 icon-action-view" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditModal(set)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4 icon-action-edit" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(set.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 icon-action-delete" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addModalOpen} onOpenChange={(open) => !open && closeAddModal()}>
        <DialogContent className="min-w-[800px] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Custom Order Set' : 'Add Custom Order Set'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label
                htmlFor="order-set-name"
                className="text-sm font-medium text-foreground block mb-1.5"
              >
                Order set name
              </label>
              <Input
                id="order-set-name"
                placeholder="Enter order set name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="relative" ref={searchContainerRef}>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Search medicines, labs, and radiology (min 2 characters)
              </label>
              <div className="flex items-center gap-2 rounded-md border bg-transparent overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <span className="flex items-center justify-center pl-3 text-muted-foreground shrink-0">
                  {catalogLoading || medicineSearchLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </span>
                <Input
                  placeholder="Search by name or code..."
                  value={searchRaw}
                  onChange={(e) => {
                    setSearchRaw(e.target.value);
                    setResultsVisible(true);
                  }}
                  onFocus={() => searchResults.length > 0 && setResultsVisible(true)}
                  onKeyDown={onSearchKeyDown}
                  disabled={catalogLoading && catalogItems.length === 0}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 pl-0 pr-3 py-2"
                />
              </div>
              {catalogError && (
                <p className="mt-1.5 text-xs text-destructive">{catalogError}</p>
              )}
              {resultsVisible && searchResults.length > 0 && (
                <ul
                  className="absolute left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto rounded-md border bg-background shadow-lg z-20 py-1"
                  role="listbox"
                >
                  {searchResults.map((item, i) => (
                    <li
                      key={item.id}
                      role="option"
                      aria-selected={highlightedResultIndex === i}
                      className={cn(
                        'flex items-center justify-between gap-2 cursor-pointer px-3 py-2 text-sm hover:bg-muted/50',
                        highlightedResultIndex === i && 'bg-muted',
                      )}
                      onClick={() => addOrderToForm(item)}
                    >
                      <div className="min-w-0">
                        <span className="font-medium block truncate">{item.name}</span>
                        {item.code && (
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {item.code}
                          </span>
                        )}
                      </div>
                      <CategoryTag category={item.category} />
                    </li>
                  ))}
                </ul>
              )}
              {resultsVisible &&
                debouncedSearch.length >= MIN_SEARCH_LENGTH &&
                !catalogLoading &&
                !medicineSearchLoading &&
                searchResults.length === 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 rounded-md border bg-background shadow-lg z-20 px-3 py-2 text-sm text-muted-foreground">
                    No matching medicines, labs, or radiology studies.
                  </div>
                )}
            </div>
            {formOrders.length > 0 && (
              <div>
                <p className="text-sm font-medium text-foreground mb-2">
                  Orders in this set ({formOrders.length})
                </p>
                <ul className="space-y-1 max-h-40 overflow-y-auto rounded-md border p-2">
                  {formOrders.map((order) => (
                    <li
                      key={order.id}
                      className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 bg-muted/50 text-sm"
                    >
                      <div className="min-w-0">
                        <span className="font-medium block truncate">{order.name}</span>
                        {order.code && (
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {order.code}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <CategoryTag category={order.category} />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => removeOrderFromForm(order.id)}
                          title="Remove"
                        >
                          <Trash2 className="h-3 w-3 icon-action-delete" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAddModal}>
              Cancel
            </Button>
            <Button onClick={handleSaveOrderSet} disabled={!formName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="min-w-[800px] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Order set details</DialogTitle>
          </DialogHeader>
          {viewingSet && (
            <div className="space-y-4 py-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Order set name</p>
                <p className="text-base font-medium text-foreground mt-0.5">{viewingSet.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Orders ({viewingSet.orders?.length ?? 0})
                </p>
                <ul className="space-y-1 max-h-60 overflow-y-auto rounded-md border p-2">
                  {(viewingSet.orders || []).map((order) => (
                    <li
                      key={order.id}
                      className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 bg-muted/30 text-sm"
                    >
                      <div className="min-w-0">
                        <span className="font-medium block truncate">{order.name}</span>
                        {order.code && (
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {order.code}
                          </span>
                        )}
                      </div>
                      <CategoryTag category={order.category} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewModalOpen(false)}>
              Close
            </Button>
            {viewingSet && (
              <Button
                variant="outline"
                onClick={() => {
                  setViewModalOpen(false);
                  openEditModal(viewingSet);
                }}
              >
                <Pencil className="h-4 w-4 mr-2 icon-action-edit" />
                Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
