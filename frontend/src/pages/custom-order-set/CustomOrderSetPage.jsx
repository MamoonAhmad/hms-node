import { useState, useCallback, useEffect, useRef } from 'react';
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
import { Search, Trash2, Plus, Eye, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { customOrderSetApi, orderApi } from '@/services/api';
import {
  MIN_ORDER_SEARCH_LENGTH,
  CATEGORY_TAG_CLASSES,
  normalizeCategory,
} from '@/pages/patient-dashboard/orders/orderConstants';

const DEBOUNCE_MS = 300;
const LEGACY_STORAGE_KEY = 'hms-custom-order-sets';

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
      {category}
    </span>
  );
}

function formatDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString(undefined, { dateStyle: 'short' });
}

function procedureToItem(procedure) {
  return {
    procedureId: procedure.id,
    procedureCode: procedure.code || procedure.procedureCode,
    procedureName: procedure.name || procedure.procedureName,
    category: normalizeCategory(procedure.category),
    isActive: true,
  };
}

function itemToDisplay(item) {
  return {
    id: item.procedureId || item.id,
    code: item.procedureCode || item.code,
    name: item.procedureName || item.name,
    category: item.category,
  };
}

export function CustomOrderSetPage() {
  const [orderSets, setOrderSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingSet, setViewingSet] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formOrders, setFormOrders] = useState([]);
  const [searchRaw, setSearchRaw] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [resultsVisible, setResultsVisible] = useState(false);
  const [highlightedResultIndex, setHighlightedResultIndex] = useState(0);
  const searchContainerRef = useRef(null);

  const debouncedSearch = useDebounce(searchRaw.trim(), DEBOUNCE_MS);

  const loadOrderSets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customOrderSetApi.list({ limit: 100, status: 'active' });
      const data = res?.data ?? [];
      if (data.length === 0) {
        await migrateLegacyStorage();
        const retry = await customOrderSetApi.list({ limit: 100, status: 'active' });
        setOrderSets(retry?.data ?? []);
      } else {
        setOrderSets(data);
      }
    } catch {
      setOrderSets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  async function migrateLegacyStorage() {
    try {
      const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!raw) return;
      const legacy = JSON.parse(raw);
      if (!Array.isArray(legacy) || !legacy.length) return;
      for (const set of legacy) {
        await customOrderSetApi.create({
          name: set.name,
          category: set.category || null,
          items: (set.orders || []).map((o) => ({
            procedureId: o.id,
            procedureCode: o.code,
            procedureName: o.name,
            category: normalizeCategory(o.category),
          })),
        });
      }
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // ignore migration errors
    }
  }

  useEffect(() => {
    loadOrderSets();
  }, [loadOrderSets]);

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
        const addedIds = new Set(formOrders.map((o) => o.procedureId || o.id));
        const filtered = (res?.data ?? []).filter((p) => !addedIds.has(p.id));
        if (!cancelled) setSearchResults(filtered);
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, formOrders]);

  const openAddModal = useCallback(() => {
    setEditingId(null);
    setFormName('');
    setFormCategory('');
    setFormDescription('');
    setFormOrders([]);
    setSearchRaw('');
    setResultsVisible(false);
    setSaveError(null);
    setAddModalOpen(true);
  }, []);

  const openEditModal = useCallback((set) => {
    setEditingId(set.id);
    setFormName(set.name);
    setFormCategory(set.category || '');
    setFormDescription(set.description || '');
    setFormOrders((set.items || set.orders || []).map((o) => ({ ...o })));
    setSearchRaw('');
    setResultsVisible(false);
    setSaveError(null);
    setAddModalOpen(true);
  }, []);

  const openViewModal = useCallback(async (set) => {
    try {
      const res = await customOrderSetApi.getById(set.id);
      setViewingSet(res?.data || set);
      setViewModalOpen(true);
    } catch {
      setViewingSet(set);
      setViewModalOpen(true);
    }
  }, []);

  const closeAddModal = useCallback(() => {
    setAddModalOpen(false);
    setEditingId(null);
    setFormName('');
    setFormCategory('');
    setFormDescription('');
    setFormOrders([]);
    setSaveError(null);
  }, []);

  const addProcedureToForm = useCallback((procedure) => {
    setFormOrders((prev) => [...prev, procedureToItem(procedure)]);
    setSearchRaw('');
    setResultsVisible(false);
  }, []);

  const removeOrderFromForm = useCallback((procedureId) => {
    setFormOrders((prev) => prev.filter((o) => (o.procedureId || o.id) !== procedureId));
  }, []);

  const handleSaveOrderSet = useCallback(async () => {
    const name = formName.trim();
    if (!name) return;
    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        name,
        category: formCategory.trim() || null,
        description: formDescription.trim() || null,
        status: 'active',
        visibility: 'global',
        items: formOrders.map((o) => ({
          procedureId: o.procedureId || o.id || null,
          procedureCode: o.procedureCode || o.code,
          procedureName: o.procedureName || o.name,
          category: o.category || 'Other',
          isActive: o.isActive !== false,
        })),
      };
      if (editingId) {
        await customOrderSetApi.update(editingId, payload);
      } else {
        await customOrderSetApi.create(payload);
      }
      await loadOrderSets();
      closeAddModal();
    } catch (err) {
      setSaveError(err?.message || 'Failed to save order set.');
    } finally {
      setSaving(false);
    }
  }, [formName, formCategory, formDescription, formOrders, editingId, closeAddModal, loadOrderSets]);

  const handleDelete = useCallback(
    async (id) => {
      if (!window.confirm('Delete this order set?')) return;
      try {
        await customOrderSetApi.delete(id);
        await loadOrderSets();
        if (viewingSet?.id === id) setViewModalOpen(false);
      } catch (err) {
        setSaveError(err?.message || 'Failed to delete order set.');
      }
    },
    [loadOrderSets, viewingSet?.id],
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
        addProcedureToForm(searchResults[highlightedResultIndex]);
      } else if (e.key === 'Escape') {
        setResultsVisible(false);
      }
    },
    [resultsVisible, searchResults, highlightedResultIndex, addProcedureToForm],
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
            Create and manage custom order sets. Active sets are searchable from Patient Order Entry.
          </p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="h-4 w-4 mr-2" />
          Add Custom Order Set
        </Button>
      </div>

      {saveError && !addModalOpen && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {saveError}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order sets</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="rounded-md border py-12 text-center text-muted-foreground text-sm">
              Loading order sets…
            </div>
          ) : orderSets.length === 0 ? (
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
                    <TableHead>Category</TableHead>
                    <TableHead>Orders</TableHead>
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
                      <TableCell className="text-muted-foreground">{set.category || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{set.orderCount ?? set.items?.length ?? 0}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(set.createdAt)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(set.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openViewModal(set)} title="View">
                            <Eye className="h-4 w-4 icon-action-view" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditModal(set)} title="Edit">
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
            <DialogTitle>{editingId ? 'Edit Custom Order Set' : 'Add Custom Order Set'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {saveError && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {saveError}
              </div>
            )}
            <div>
              <label htmlFor="order-set-name" className="text-sm font-medium text-foreground block mb-1.5">
                Order set name
              </label>
              <Input
                id="order-set-name"
                placeholder="Enter order set name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="order-set-category" className="text-sm font-medium text-foreground block mb-1.5">
                Category
              </label>
              <Input
                id="order-set-category"
                placeholder="e.g. Lab, Imaging"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="order-set-description" className="text-sm font-medium text-foreground block mb-1.5">
                Description
              </label>
              <Input
                id="order-set-description"
                placeholder="Optional description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
            <div className="relative" ref={searchContainerRef}>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Search and add orders (min 2 characters)
              </label>
              <div className="flex items-center gap-2 rounded-md border bg-transparent overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <span className="flex items-center justify-center pl-3 text-muted-foreground shrink-0">
                  <Search className="h-4 w-4" />
                </span>
                <Input
                  placeholder="Search orders..."
                  value={searchRaw}
                  onChange={(e) => {
                    setSearchRaw(e.target.value);
                    setResultsVisible(true);
                  }}
                  onFocus={() => setResultsVisible(true)}
                  onKeyDown={onSearchKeyDown}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 pl-0 pr-3 py-2"
                />
              </div>
              {resultsVisible && debouncedSearch.length >= MIN_ORDER_SEARCH_LENGTH && (
                <ul
                  className="absolute left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto rounded-md border bg-background shadow-lg z-20 py-1"
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
                      onClick={() => addProcedureToForm(p)}
                    >
                      <span className="font-medium">{p.name}</span>
                      <CategoryTag category={p.category} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {formOrders.length > 0 && (
              <div>
                <p className="text-sm font-medium text-foreground mb-2">
                  Orders in this set ({formOrders.length})
                </p>
                <ul className="space-y-1 max-h-40 overflow-y-auto rounded-md border p-2">
                  {formOrders.map((order) => {
                    const display = itemToDisplay(order);
                    return (
                      <li
                        key={display.id}
                        className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 bg-muted/50 text-sm"
                      >
                        <span className="font-medium">{display.name}</span>
                        <div className="flex items-center gap-1">
                          <CategoryTag category={display.category} />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => removeOrderFromForm(display.id)}
                            title="Remove"
                          >
                            <Trash2 className="h-3 w-3 icon-action-delete" />
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAddModal}>
              Cancel
            </Button>
            <Button onClick={handleSaveOrderSet} disabled={!formName.trim() || saving}>
              {saving ? 'Saving…' : 'Save'}
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
              {viewingSet.category && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Category</p>
                  <p className="text-base text-foreground mt-0.5">{viewingSet.category}</p>
                </div>
              )}
              {viewingSet.createdByName && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created by</p>
                  <p className="text-base text-foreground mt-0.5">{viewingSet.createdByName}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Orders ({(viewingSet.items || viewingSet.orders)?.length ?? 0})
                </p>
                <ul className="space-y-1 max-h-60 overflow-y-auto rounded-md border p-2">
                  {(viewingSet.items || viewingSet.orders || []).map((order) => {
                    const display = itemToDisplay(order);
                    return (
                      <li
                        key={display.id}
                        className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 bg-muted/30 text-sm"
                      >
                        <span className="font-medium">{display.name}</span>
                        <CategoryTag category={display.category} />
                      </li>
                    );
                  })}
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
