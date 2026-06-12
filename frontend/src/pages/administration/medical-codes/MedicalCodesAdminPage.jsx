import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Trash2, Check, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
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
import { MedicalCodeFormDialog } from '@/pages/administration/medical-codes/MedicalCodeFormDialog';
import { STATUS_FILTER_OPTIONS } from '@/pages/administration/medical-codes/medicalCodesAdminConfig';
import {
  deleteCode,
  ensureSeedData,
  getStoredCodes,
  isDuplicateCode,
  upsertCode,
} from '@/pages/administration/medical-codes/medicalCodesStorage';

function StatusBadge({ isActive }) {
  return isActive ? (
    <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800 hover:bg-green-100">
      <Check className="h-3 w-3" />
      Active
    </Badge>
  ) : (
    <Badge variant="secondary" className="gap-1">
      <X className="h-3 w-3" />
      Inactive
    </Badge>
  );
}

function formatViewValue(row, field, config) {
  const value = row[field.key];
  switch (field.format) {
    case 'category':
      return config.formatCategory(value);
    case 'codeLevel':
      return config.formatCodeLevel?.(value || config.inferCodeLevel?.(row.code)) || value || '—';
    case 'codeType':
      return config.formatCodeType?.(value) || value || '—';
    case 'status':
      return row.isActive !== false ? 'Active' : 'Inactive';
    case 'billable':
      return value !== false ? 'Yes' : 'No';
    case 'chronic':
      return value ? 'Yes' : 'No';
    default:
      return value != null && value !== '' ? String(value) : '—';
  }
}

export function MedicalCodesAdminPage({ config }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [secondaryFilter, setSecondaryFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [isLoading, setIsLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ctx = useMemo(
    () => ({
      formatCategory: config.formatCategory,
      formatCodeLevel: config.formatCodeLevel,
      formatCodeType: config.formatCodeType,
      inferCodeLevel: config.inferCodeLevel,
    }),
    [config],
  );

  const load = useCallback(() => {
    setItems(ensureSeedData(config.storageKey, config.seed, config.seedVersion));
  }, [config.storageKey, config.seed, config.seedVersion]);

  useEffect(() => {
    setIsLoading(true);
    load();
    setIsLoading(false);
  }, [load]);

  const summaryStats = useMemo(
    () => (config.getSummaryStats ? config.getSummaryStats(items) : []),
    [config, items],
  );

  const filtered = useMemo(() => {
    let list = items;

    if (statusFilter === 'active') list = list.filter((row) => row.isActive !== false);
    if (statusFilter === 'inactive') list = list.filter((row) => row.isActive === false);
    if (categoryFilter !== 'all') list = list.filter((row) => row.category === categoryFilter);

    const secondaryKey = config.secondaryFilterKey;
    if (secondaryFilter !== 'all' && secondaryKey) {
      list = list.filter((row) => {
        const val = row[secondaryKey];
        if (secondaryKey === 'codeLevel' && config.inferCodeLevel && !val) {
          return config.inferCodeLevel(row.code) === secondaryFilter;
        }
        return val === secondaryFilter;
      });
    }

    const q = search.trim().toLowerCase();
    if (!q) return list;

    return list.filter((row) => {
      const parts =
        config.formFields === 'hcpcs'
          ? [
              row.code,
              row.shortDescription,
              row.longDescription,
              row.modifier,
              row.category,
              row.codeLevel,
              row.revenueCode,
              row.internalNotes,
              config.formatCategory(row.category),
            ]
          : [
              row.code,
              row.description,
              row.category,
              row.codeType,
              row.internalNotes,
              row.effectiveFrom,
              row.effectiveTo,
              config.formatCategory(row.category),
              config.formatCodeType?.(row.codeType),
            ];
      return parts
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [items, search, statusFilter, categoryFilter, secondaryFilter, config]);

  const total = filtered.length;
  const currentPage = Math.min(
    Math.max(1, pagination.page),
    Math.max(1, Math.ceil(total / pagination.limit)),
  );
  const rows = useMemo(
    () =>
      filtered
        .slice((currentPage - 1) * pagination.limit, currentPage * pagination.limit)
        .map((row, i) => ({
          ...row,
          _srNo: (currentPage - 1) * pagination.limit + i + 1,
        })),
    [filtered, currentPage, pagination.limit],
  );

  const tableColumns = useMemo(
    () => [
      { key: '_srNo', label: 'Sr No' },
      ...config.columns.map((col) => ({
        key: col.key,
        label: col.label,
        cellClassName: col.cellClassName,
        render: col.render ? (row) => col.render(row, ctx) : undefined,
      })),
      {
        key: 'status',
        label: 'Status',
        render: (row) => <StatusBadge isActive={row.isActive !== false} />,
      },
    ],
    [config.columns, ctx],
  );

  const handleSearch = useCallback((keyword) => {
    setSearch(keyword);
    setPagination((p) => ({ ...p, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page) => {
    setPagination((p) => ({ ...p, page }));
  }, []);

  const handlePageSizeChange = useCallback((limit) => {
    setPagination((p) => ({ ...p, limit, page: 1 }));
  }, []);

  const openCreate = () => {
    setSelected(null);
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setSelected(row);
    setFormOpen(true);
  };

  const openView = (row) => {
    setSelected(row);
    setViewOpen(true);
  };

  const openDelete = (row) => {
    setSelected(row);
    setDeleteOpen(true);
  };

  const handleFormSubmit = async (data) => {
    const list = getStoredCodes(config.storageKey);
    if (isDuplicateCode(list, data.code, selected?.id)) {
      alert(`Code "${data.code}" already exists.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload =
        config.formFields === 'hcpcs' && config.inferCodeLevel && !data.codeLevel
          ? { ...data, codeLevel: config.inferCodeLevel(data.code) }
          : data;
      upsertCode(config.storageKey, payload, selected?.id);
      load();
      setFormOpen(false);
      setSelected(null);
    } catch (err) {
      alert(err?.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selected?.id) return;
    setIsSubmitting(true);
    try {
      deleteCode(config.storageKey, selected.id);
      load();
      setDeleteOpen(false);
      setSelected(null);
    } catch (err) {
      alert(err?.message || 'Failed to delete');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteLabel =
    config.formFields === 'hcpcs'
      ? selected?.code || selected?.shortDescription
      : selected?.code || selected?.description;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1 max-w-2xl">
          <h1 className="text-2xl font-bold text-foreground">{config.title}</h1>
          <p className="text-muted-foreground">{config.description}</p>
        </div>
        <Button onClick={openCreate} className="w-full sm:w-auto shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          {config.addLabel}
        </Button>
      </div>

      {config.pageIntro && (
        <Card className="border-primary/15 bg-primary/[0.04]">
          <CardContent className="flex gap-3 p-4">
            <Info className="h-5 w-5 shrink-0 text-primary mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="font-medium text-foreground">{config.pageIntro.title}</p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                {config.pageIntro.bullets.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {summaryStats.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {summaryStats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={categoryFilter}
          onValueChange={(v) => {
            setCategoryFilter(v);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
        >
          <SelectTrigger className="w-full sm:w-[240px]" aria-label="Filter by category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {config.categoryFilterOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {config.secondaryFilterOptions && (
          <Select
            value={secondaryFilter}
            onValueChange={(v) => {
              setSecondaryFilter(v);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px]" aria-label="Secondary filter">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {config.secondaryFilterOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <DataTable
        columns={tableColumns}
        data={rows}
        total={total}
        page={currentPage}
        pageSize={pagination.limit}
        searchValue={search}
        isLoading={isLoading}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        getRowId={(row) => row.id}
        searchPlaceholder={config.searchPlaceholder}
        emptyMessage={`No ${config.title.toLowerCase()} found`}
        actions={(row) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => openView(row)}
              aria-label="View"
              title="View"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => openEdit(row)}
              aria-label="Edit"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => openDelete(row)}
              className="text-destructive hover:text-destructive"
              aria-label="Delete"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />

      <MedicalCodeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        config={config}
        record={selected}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {config.formFields === 'hcpcs' ? 'HCPCS / CPT Code' : 'ICD-10 Diagnosis'} —{' '}
              <span className="font-mono">{selected?.code}</span>
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <dl className="grid gap-3 text-sm">
              {config.viewFields.map((field) => (
                <div key={field.key} className="grid gap-1 sm:grid-cols-3 sm:gap-4">
                  <dt className="text-muted-foreground">{field.label}</dt>
                  <dd className="sm:col-span-2 font-medium break-words">
                    {formatViewValue(selected, field, config)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setViewOpen(false)}>
              Close
            </Button>
            <Button
              type="button"
              onClick={() => {
                setViewOpen(false);
                openEdit(selected);
              }}
            >
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {config.title.replace(/ Codes$/, ' Code')}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-mono font-medium text-foreground">{deleteLabel || 'this code'}</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
