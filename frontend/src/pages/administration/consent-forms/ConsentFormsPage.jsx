import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConsentFormDialog } from '@/pages/administration/consent-forms/ConsentFormDialog';
import { ConsentFormViewDialog } from '@/pages/administration/consent-forms/ConsentFormViewDialog';
import {
  CONSENT_LIST_TABS,
  CONSENT_LIST_TAB_OPTIONS,
  formatConsentType,
} from '@/pages/administration/consent-forms/consentFormsConstants';
import { consentFormApi } from '@/services/api';

export function ConsentFormsPage() {
  const [items, setItems] = useState([]);
  const [tabCounts, setTabCounts] = useState({});
  const [listTab, setListTab] = useState(CONSENT_LIST_TABS.ALL);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);
  const [editRecord, setEditRecord] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchForms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await consentFormApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        tab: listTab,
      });
      setItems(response.data || []);
      setTabCounts(response.tabCounts || {});
      setPagination((prev) => ({ ...prev, ...response.pagination }));
    } catch (err) {
      setError(err.message);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, listTab]);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const handleListTabChange = useCallback((tab) => {
    setListTab(tab);
    setPagination((p) => ({ ...p, page: 1 }));
  }, []);

  const emptyMessageByTab = useMemo(() => {
    const tabLabel = CONSENT_LIST_TAB_OPTIONS.find((t) => t.value === listTab)?.label ?? 'forms';
    return search.trim()
      ? 'No consent forms match your search'
      : `No ${tabLabel.toLowerCase()} found`;
  }, [listTab, search]);

  const rows = useMemo(
    () =>
      items.map((row, i) => ({
        ...row,
        _srNo: (pagination.page - 1) * pagination.limit + i + 1,
      })),
    [items, pagination.page, pagination.limit],
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

  const openEdit = async (record) => {
    try {
      const response = await consentFormApi.getById(record.id);
      setEditRecord(response.data);
      setDialogOpen(true);
    } catch (err) {
      alert(err.message || 'Failed to load consent form');
    }
  };

  const openView = async (record) => {
    try {
      const response = await consentFormApi.getById(record.id);
      setViewRecord(response.data);
    } catch (err) {
      alert(err.message || 'Failed to load consent form');
    }
  };

  const handleSave = async (formValues) => {
    setIsSubmitting(true);
    try {
      if (editRecord?.id) {
        await consentFormApi.update(editRecord.id, formValues);
      } else {
        await consentFormApi.create(formValues);
      }
      setEditRecord(null);
      setDialogOpen(false);
      fetchForms();
    } catch (err) {
      alert(err.message || 'Save failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteRecord) return;
    setIsSubmitting(true);
    try {
      await consentFormApi.delete(deleteRecord.id);
      setDeleteRecord(null);
      fetchForms();
    } catch (err) {
      alert(err.message || 'Delete failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Consent Forms</h1>
          <p className="text-muted-foreground mt-1">
            Manage consent form templates used during patient registration and encounters.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setEditRecord(null);
            setDialogOpen(true);
          }}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Consent Form
        </Button>
      </div>

      <section className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm sm:px-6">
        <Tabs value={listTab} onValueChange={handleListTabChange}>
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-3 lg:max-w-4xl lg:grid-cols-5">
            {CONSENT_LIST_TAB_OPTIONS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
                <span>{tab.label}</span>
                <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px] font-semibold">
                  {tabCounts[tab.value] ?? 0}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </section>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      <DataTable
        columns={[
          {
            key: '_srNo',
            label: 'Sr. No.',
            align: 'center',
            className: 'w-14 min-w-14 max-w-16 px-2',
            cellClassName: 'w-14 min-w-14 max-w-16 px-2 tabular-nums',
            render: (row) => row._srNo,
          },
          { key: 'consentTitle', label: 'Consent Title', cellClassName: 'font-medium' },
          {
            key: 'consentType',
            label: 'Consent Type',
            render: (row) => formatConsentType(row.consentType),
          },
        ]}
        data={rows}
        total={pagination.total}
        page={pagination.page}
        pageSize={pagination.limit}
        searchValue={search}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        searchPlaceholder="Search consent forms…"
        emptyMessage={emptyMessageByTab}
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
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
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setDeleteRecord(row)}
              className="text-destructive hover:text-destructive"
              aria-label="Delete"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />

      <ConsentFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditRecord(null);
        }}
        record={editRecord}
        onSave={handleSave}
        isSubmitting={isSubmitting}
      />

      <ConsentFormViewDialog
        open={!!viewRecord}
        record={viewRecord}
        onOpenChange={(open) => !open && setViewRecord(null)}
        onEdit={(row) => {
          setViewRecord(null);
          openEdit(row);
        }}
      />

      <Dialog open={!!deleteRecord} onOpenChange={(open) => !open && setDeleteRecord(null)}>
        <DialogContent className="max-w-md w-[calc(100%-2rem)] sm:w-full">
          <DialogHeader>
            <DialogTitle>Delete consent form</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold">{deleteRecord?.consentTitle}</span>? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteRecord(null)}
              disabled={isSubmitting}
            >
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
