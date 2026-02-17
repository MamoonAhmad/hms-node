import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, FileText } from 'lucide-react';
import { labApi } from '@/services/api';
import { LAB_REPORT_SOURCES } from '@/lib/labConstants';
import { ReceiveLabReportDialog } from './ReceiveLabReportDialog';

function formatDateTime(dateTimeString) {
  if (!dateTimeString) return '-';
  const date = new Date(dateTimeString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function LabReportReceivedPage() {
  const [list, setList] = useState([]);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [receiveOpen, setReceiveOpen] = useState(false);

  const loadList = useCallback(() => {
    const source = sourceFilter === 'all' ? undefined : sourceFilter;
    labApi
      .getLabReportReceivedList({ source, search: search || undefined })
      .then((res) => setList(res?.data ?? []))
      .catch(() => setList([]));
  }, [sourceFilter, search]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handleSearch = useCallback((keyword) => {
    setSearch(keyword);
    setPagination((p) => ({ ...p, page: 1 }));
  }, []);
  const handlePageChange = useCallback((page) => setPagination((p) => ({ ...p, page })), []);
  const handlePageSizeChange = useCallback((limit) => setPagination((p) => ({ ...p, limit, page: 1 })), []);

  const total = list.length;
  const currentPage = Math.min(Math.max(1, pagination.page), Math.max(1, Math.ceil(total / pagination.limit)));
  const rows = useMemo(
    () => list.slice((currentPage - 1) * pagination.limit, currentPage * pagination.limit),
    [list, currentPage, pagination.limit]
  );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Lab report received</h1>
        <p className="text-muted-foreground">
          Patient has come from another facility with lab reports. Receive and attach reports to the chart for the doctor to view.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Received reports</CardTitle>
          <Button onClick={() => setReceiveOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Receive report
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); setPagination((p) => ({ ...p, page: 1 })); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                {LAB_REPORT_SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DataTable
            columns={[
              {
                key: 'patient',
                label: 'Patient',
                render: (report) => (
                  <div className="space-y-0.5">
                    <div className="font-medium">{report.patient?.name ?? '-'}</div>
                    <div className="text-xs text-muted-foreground">{report.patient?.mrn ?? ''}</div>
                  </div>
                ),
              },
              { key: 'source', label: 'Source', render: (row) => row.source },
              { key: 'receivedDate', label: 'Received date', cellClassName: 'text-sm text-muted-foreground', render: (row) => formatDateTime(row.receivedDate) },
              { key: 'receivedBy', label: 'Received by', cellClassName: 'text-sm', render: (row) => row.receivedBy || '-' },
              { key: 'reportDate', label: 'Report date', cellClassName: 'text-sm text-muted-foreground', render: (row) => (row.reportDate ? formatDateTime(row.reportDate) : '-') },
              { key: 'performingLab', label: 'Performing lab', cellClassName: 'text-sm', render: (row) => row.performingLab || '-' },
              { key: 'description', label: 'Description', cellClassName: 'text-sm max-w-[200px] truncate', render: (row) => row.fileName || row.description || '-' },
              {
                key: 'attachment',
                label: 'Attachment',
                render: (report) =>
                  report.hasAttachment || report.attachmentData ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="View report"
                      onClick={() => {
                        const data = report.attachmentData;
                        if (data) window.open(data, '_blank', 'noopener');
                      }}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  ),
              },
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
            searchPlaceholder="Search by patient name, MRN, performing lab..."
            emptyMessage="No received reports. Click Receive report to add one."
          />
        </CardContent>
      </Card>

      <ReceiveLabReportDialog
        open={receiveOpen}
        onOpenChange={setReceiveOpen}
        onSaved={loadList}
      />
    </div>
  );
}
