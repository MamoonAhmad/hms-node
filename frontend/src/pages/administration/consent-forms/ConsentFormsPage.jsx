import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { ConsentFormDialog } from '@/pages/administration/consent-forms/ConsentFormDialog';
import {
  emptyConsentForm,
  formatConsentStatus,
  formatConsentType,
  getStoredConsentForms,
  setStoredConsentForms,
} from '@/pages/administration/consent-forms/consentFormsConstants';

function auditUserLabel(user) {
  if (!user) return 'System';
  return user.fullName || user.name || user.email || user.username || 'System';
}

export function ConsentFormsPage() {
  const { user } = useAuth();
  const auditName = auditUserLabel(user);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);
  const [editRecord, setEditRecord] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);

  const load = useCallback(() => {
    setItems(getStoredConsentForms());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter((row) => {
      const haystack = [
        row.consentTitle,
        row.description,
        row.department,
        row.tags,
        row.language,
        formatConsentType(row.consentType),
        formatConsentStatus(row.status),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [items, search]);

  const total = filtered.length;
  const currentPage = Math.min(
    Math.max(1, pagination.page),
    Math.max(1, Math.ceil(total / pagination.limit)),
  );
  const rows = useMemo(
    () =>
      filtered
        .slice((currentPage - 1) * pagination.limit, currentPage * pagination.limit)
        .map((row, i) => ({ ...row, _srNo: (currentPage - 1) * pagination.limit + i + 1 })),
    [filtered, currentPage, pagination.limit],
  );

  const handleSearch = useCallback((keyword) => {
    setSearch(keyword);
    setPagination((p) => ({ ...p, page: 1 }));
  }, []);
  const handlePageChange = useCallback((page) => setPagination((p) => ({ ...p, page })), []);
  const handlePageSizeChange = useCallback(
    (limit) => setPagination((p) => ({ ...p, limit, page: 1 })),
    [],
  );

  const handleSave = (formValues) => {
    const now = new Date().toISOString();
    const list = getStoredConsentForms();

    if (editRecord?.id) {
      const next = list.map((row) =>
        row.id === editRecord.id
          ? {
              ...row,
              ...formValues,
              updatedBy: auditName,
              updatedDate: now,
            }
          : row,
      );
      setStoredConsentForms(next);
      setItems(next);
    } else {
      const next = [
        {
          id: crypto.randomUUID(),
          ...emptyConsentForm(),
          ...formValues,
          createdBy: auditName,
          createdDate: now,
          updatedBy: auditName,
          updatedDate: now,
        },
        ...list,
      ];
      setStoredConsentForms(next);
      setItems(next);
    }

    setEditRecord(null);
    setDialogOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!deleteRecord) return;
    const next = getStoredConsentForms().filter((row) => row.id !== deleteRecord.id);
    setStoredConsentForms(next);
    setItems(next);
    setDeleteRecord(null);
  };

  const statusVariant = (status) => {
    if (status === 'active') return 'default';
    if (status === 'inactive') return 'secondary';
    return 'outline';
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
          { key: 'consentTitle', label: 'Consent Title' },
          {
            key: 'consentType',
            label: 'Type',
            render: (row) => formatConsentType(row.consentType),
          },
          { key: 'department', label: 'Department', render: (row) => row.department || '—' },
          { key: 'language', label: 'Language', render: (row) => row.language || '—' },
          {
            key: 'status',
            label: 'Status',
            render: (row) => (
              <Badge variant={statusVariant(row.status)}>{formatConsentStatus(row.status)}</Badge>
            ),
          },
          { key: 'versionNumber', label: 'Version', render: (row) => row.versionNumber || '—' },
        ]}
        data={rows}
        total={total}
        page={currentPage}
        pageSize={pagination.limit}
        searchValue={search}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        getRowId={(row) => row.id}
        searchPlaceholder="Search consent forms…"
        emptyMessage="No consent forms found"
        actions={(row) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewRecord(row)}
              className="h-8 w-8 p-0"
              title="View"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditRecord(row);
                setDialogOpen(true);
              }}
              className="h-8 w-8 p-0"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteRecord(row)}
              className="h-8 w-8 p-0"
              title="Delete"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
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
        auditUserName={auditName}
        onSave={handleSave}
      />

      <Dialog open={!!viewRecord} onOpenChange={(open) => !open && setViewRecord(null)}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewRecord?.consentTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <p>
                <span className="text-muted-foreground">Type:</span>{' '}
                {formatConsentType(viewRecord?.consentType)}
              </p>
              <p>
                <span className="text-muted-foreground">Status:</span>{' '}
                {formatConsentStatus(viewRecord?.status)}
              </p>
              <p>
                <span className="text-muted-foreground">Department:</span> {viewRecord?.department || '—'}
              </p>
              <p>
                <span className="text-muted-foreground">Language:</span> {viewRecord?.language || '—'}
              </p>
            </div>
            {viewRecord?.description && (
              <p className="text-muted-foreground">{viewRecord.description}</p>
            )}
            <div
              className="rounded-lg border p-4 prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: viewRecord?.consentContent || '' }}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setViewRecord(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <Button type="button" variant="outline" onClick={() => setDeleteRecord(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
