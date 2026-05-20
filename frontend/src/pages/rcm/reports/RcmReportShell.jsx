import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/multi-select';
import { insuranceProviderApi } from '@/services/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChevronDown,
  ChevronRight,
  Download,
  FileDown,
  Loader2,
  Filter,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DATE_PRESETS = [
  { value: '30', label: 'Last 30 days' },
  { value: '7', label: 'Last 7 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'custom', label: 'Custom range' },
];

const FACILITIES = [
  { value: 'all', label: 'All facilities' },
  { value: 'main', label: 'Main Campus' },
  { value: 'east', label: 'East Wing Clinic' },
];

const FALLBACK_PAYER_OPTIONS = [
  { value: 'fallback-bcbs', label: 'Blue Cross Blue Shield (BCBS)' },
  { value: 'fallback-aetna', label: 'Aetna' },
  { value: 'fallback-uhc', label: 'United Healthcare (UHC)' },
  { value: 'fallback-medicare', label: 'Medicare' },
  { value: 'fallback-medicaid', label: 'Medicaid' },
  { value: 'fallback-cigna', label: 'Cigna' },
  { value: 'fallback-humana', label: 'Humana' },
];

const CLAIM_TYPES = [
  { value: 'all', label: 'All types' },
  { value: 'professional', label: 'Professional (CMS-1500)' },
  { value: 'institutional', label: 'Institutional (UB-04)' },
];

function downloadCsv(filename, columns, rows) {
  const headers = columns.map((c) => c.label).join(',');
  const escape = (v) => {
    const s = v == null ? '' : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = rows.map((row) => columns.map((c) => escape(row[c.key])).join(','));
  const blob = new Blob([`${headers}\n${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function SortIcon({ active, dir }) {
  if (!active) return <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-50" />;
  return dir === 'asc' ? (
    <ArrowUp className="ml-1 h-3.5 w-3.5" />
  ) : (
    <ArrowDown className="ml-1 h-3.5 w-3.5" />
  );
}

export function RcmReportShell({
  title,
  description,
  dateFilterLabel = 'Date range applies to',
  dateFilterHint = 'DOS (date of service)',
  showAsOfDate = false,
  columns = [],
  rows = [],
  summaryCards = [],
  breakdown = null,
  beforeTable = null,
  afterTable = null,
  showPdfExport = false,
  helpRule = null,
  footNote = null,
  numericFooterKeys = [],
  emptyMessage = 'Run the report to see results.',
  rowClickPath = '/rcm/claims',
}) {
  const navigate = useNavigate();
  const [criteriaOpen, setCriteriaOpen] = useState(true);
  const [datePreset, setDatePreset] = useState('30');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [asOfDate, setAsOfDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [facility, setFacility] = useState('all');
  const [payerOptions, setPayerOptions] = useState([]);
  const [selectedPayerIds, setSelectedPayerIds] = useState([]);
  const [payersLoading, setPayersLoading] = useState(true);
  const [claimType, setClaimType] = useState('all');
  const [providerQuery, setProviderQuery] = useState('');
  const [patientMrn, setPatientMrn] = useState('');
  const [hasRun, setHasRun] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRunAt, setLastRunAt] = useState(null);
  const [sort, setSort] = useState({ key: null, dir: 'asc' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPayersLoading(true);
      try {
        const res = await insuranceProviderApi.getAll({ page: 1, limit: 500 });
        const data = Array.isArray(res?.data) ? res.data : [];
        const opts = data.map((p) => ({
          value: p.id,
          label: p.code ? `${p.name} (${p.code})` : p.name,
        }));
        if (cancelled) return;
        if (opts.length === 0) {
          setPayerOptions(FALLBACK_PAYER_OPTIONS);
          setSelectedPayerIds(FALLBACK_PAYER_OPTIONS.map((o) => o.value));
        } else {
          setPayerOptions(opts);
          setSelectedPayerIds(opts.map((o) => o.value));
        }
      } catch {
        if (cancelled) return;
        setPayerOptions(FALLBACK_PAYER_OPTIONS);
        setSelectedPayerIds(FALLBACK_PAYER_OPTIONS.map((o) => o.value));
      } finally {
        if (!cancelled) setPayersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayRows = useMemo(() => {
    if (!sort.key) return rows;
    const col = columns.find((c) => c.key === sort.key);
    const copy = [...rows];
    copy.sort((a, b) => {
      const va = a[sort.key];
      const vb = b[sort.key];
      if (col?.numeric) {
        const na = Number(va) || 0;
        const nb = Number(vb) || 0;
        return sort.dir === 'asc' ? na - nb : nb - na;
      }
      const sa = String(va ?? '').toLowerCase();
      const sb = String(vb ?? '').toLowerCase();
      const cmp = sa.localeCompare(sb);
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [rows, sort, columns]);

  const footerTotals = useMemo(() => {
    if (!numericFooterKeys.length || !displayRows.length) return null;
    const totals = {};
    numericFooterKeys.forEach((k) => {
      totals[k] = displayRows.reduce((s, r) => s + (Number(r[k]) || 0), 0);
    });
    return totals;
  }, [displayRows, numericFooterKeys]);

  const handleSort = (key) => {
    const col = columns.find((c) => c.key === key);
    if (!col?.sortable) return;
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );
  };

  const runReport = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setHasRun(false);
    window.setTimeout(() => {
      setIsLoading(false);
      setHasRun(true);
      setLastRunAt(new Date());
    }, 450);
  }, []);

  const resetFilters = useCallback(() => {
    setDatePreset('30');
    setDateFrom('');
    setDateTo('');
    setAsOfDate(new Date().toISOString().slice(0, 10));
    setFacility('all');
    setSelectedPayerIds(payerOptions.map((o) => o.value));
    setClaimType('all');
    setProviderQuery('');
    setPatientMrn('');
    setHasRun(false);
    setLastRunAt(null);
    setError(null);
  }, [payerOptions]);

  const exportCsv = () => {
    if (!displayRows.length) return;
    const safe = title.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    downloadCsv(`${safe}-${new Date().toISOString().slice(0, 10)}.csv`, columns, displayRows);
  };

  const exportPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 print:p-2">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="text-muted-foreground text-sm max-w-4xl">{description}</p>
        {lastRunAt && (
          <p className="text-xs text-muted-foreground">
            Last run: {lastRunAt.toLocaleString()}
          </p>
        )}
      </div>

      <Card className="print:hidden">
        <CardHeader className="pb-2">
          <button
            type="button"
            onClick={() => setCriteriaOpen((o) => !o)}
            className="flex w-full items-center gap-2 text-left font-semibold text-foreground hover:opacity-90"
          >
            {criteriaOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
            Report criteria
          </button>
          <p className="text-xs text-muted-foreground pl-6">
            {dateFilterLabel}: <span className="font-medium text-foreground">{dateFilterHint}</span>
          </p>
        </CardHeader>
        {criteriaOpen && (
          <CardContent className="space-y-4 pt-0">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="min-w-0 space-y-2">
                <Label>Date preset</Label>
                <Select value={datePreset} onValueChange={setDatePreset}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_PRESETS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {datePreset === 'custom' && (
                <>
                  <div className="min-w-0 space-y-2">
                    <Label htmlFor="rpt-from">From</Label>
                    <Input className="w-full" id="rpt-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  </div>
                  <div className="min-w-0 space-y-2">
                    <Label htmlFor="rpt-to">To</Label>
                    <Input className="w-full" id="rpt-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                  </div>
                </>
              )}
              {showAsOfDate && (
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="rpt-asof">As of date</Label>
                  <Input className="w-full" id="rpt-asof" type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} />
                </div>
              )}
              <div className="min-w-0 space-y-2">
                <Label>Facility / location</Label>
                <Select value={facility} onValueChange={setFacility}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FACILITIES.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0 space-y-2">
                <Label>Claim type</Label>
                <Select value={claimType} onValueChange={setClaimType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLAIM_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="rpt-provider">Provider (optional)</Label>
                <Input
                  className="w-full"
                  id="rpt-provider"
                  placeholder="Search rendering / billing provider"
                  value={providerQuery}
                  onChange={(e) => setProviderQuery(e.target.value)}
                />
              </div>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="rpt-mrn">Patient / MRN (optional)</Label>
                <Input
                  className="w-full"
                  id="rpt-mrn"
                  placeholder="MRN or patient name"
                  value={patientMrn}
                  onChange={(e) => setPatientMrn(e.target.value)}
                />
              </div>
              <div className="col-span-full min-w-0 max-w-sm space-y-2">
                <Label htmlFor="rpt-payers-trigger">Payers</Label>
                <MultiSelect
                  id="rpt-payers-trigger"
                  className="w-full max-w-sm"
                  options={payerOptions}
                  value={selectedPayerIds}
                  onChange={setSelectedPayerIds}
                  placeholder={payersLoading ? 'Loading payers…' : 'Select payers'}
                  searchable
                  showSelectAll
                  selectAllLabel="Select all"
                  searchPlaceholder="Search payers…"
                  emptySearchMessage="No payers match your search"
                />
                {selectedPayerIds.length === 0 && !payersLoading && (
                  <p className="text-xs text-amber-600 dark:text-amber-500">
                    Select at least one payer to scope the report.
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="button" onClick={runReport} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Filter className="h-4 w-4 mr-2" />}
                Filter
              </Button>
              <Button type="button" variant="outline" onClick={resetFilters}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset filters
              </Button>
              <Button type="button" variant="secondary" onClick={exportCsv} disabled={!hasRun || !displayRows.length}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              {showPdfExport && (
                <Button type="button" variant="secondary" onClick={exportPdf} disabled={!hasRun || !displayRows.length}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Print / PDF
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground border-t pt-3">
              Export access is role-restricted. CSV exports may contain PHI—only use for authorized billing and
              compliance workflows.
            </p>
          </CardContent>
        )}
      </Card>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Running report…</span>
        </div>
      )}

      {!isLoading && hasRun && summaryCards.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 print:grid-cols-3">
          {summaryCards.map((card) => (
            <Card key={card.id}>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-medium text-muted-foreground">{card.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold tabular-nums">{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && hasRun && breakdown?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Summary breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    {breakdown[0].amount != null ? (
                      <>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-40">Share</TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                        <TableHead className="w-40">Share</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {breakdown.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.label}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.count}</TableCell>
                      {row.amount != null && (
                        <TableCell className="text-right tabular-nums">
                          {typeof row.amount === 'number'
                            ? row.amount.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
                            : row.amount}
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{
                                width: `${row.pct ?? Math.min(100, (row.count / Math.max(1, breakdown.reduce((s, r) => s + r.count, 0))) * 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                            {row.pct != null ? `${row.pct}%` : ''}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && hasRun && beforeTable}

      {!isLoading && hasRun && (
        <Card className="overflow-hidden">
          <CardHeader className="border-b py-3">
            <CardTitle className="text-base">Results</CardTitle>
            {helpRule && <p className="text-xs text-muted-foreground font-normal mt-1">{helpRule}</p>}
          </CardHeader>
          <CardContent className="p-0">
            {!displayRows.length ? (
              <p className="py-12 text-center text-sm text-muted-foreground">{emptyMessage}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((col) => (
                      <TableHead
                        key={col.key}
                        className={cn(col.align === 'right' && 'text-right', col.sortable && 'cursor-pointer select-none')}
                        onClick={() => handleSort(col.key)}
                      >
                        <span className="inline-flex items-center">
                          {col.label}
                          {col.sortable && <SortIcon active={sort.key === col.key} dir={sort.dir} />}
                        </span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayRows.map((row, idx) => (
                    <TableRow
                      key={row.id ?? idx}
                      className={cn(row._highlight && 'bg-amber-500/10', rowClickPath && 'cursor-pointer')}
                      onClick={() => rowClickPath && navigate(rowClickPath)}
                    >
                      {columns.map((col) => (
                        <TableCell
                          key={col.key}
                          className={cn(col.align === 'right' && 'text-right', col.numeric && 'tabular-nums')}
                        >
                          {formatCell(row[col.key], col)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
                {footerTotals && (
                  <TableFooter>
                    <TableRow>
                      {columns.map((col, i) => (
                        <TableCell
                          key={col.key}
                          className={cn(
                            col.align === 'right' && 'text-right',
                            footerTotals[col.key] != null && 'tabular-nums font-semibold'
                          )}
                        >
                          {i === 0
                            ? 'Totals'
                            : footerTotals[col.key] != null
                              ? col.format === 'currency'
                                ? formatMoney(footerTotals[col.key])
                                : Number(footerTotals[col.key]).toLocaleString()
                              : '—'}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {!isLoading && hasRun && afterTable}

      {footNote && hasRun && !isLoading && (
        <p className="text-xs text-muted-foreground print:text-[10px]">{footNote}</p>
      )}
    </div>
  );
}

function formatMoney(n) {
  if (n == null || Number.isNaN(n)) return '—';
  return Number(n).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function formatCell(value, col) {
  if (value == null || value === '') return '—';
  if (col.format === 'currency') return formatMoney(value);
  if (col.format === 'date') return value;
  return value;
}

export function TrendPeriodChart({ series, metrics }) {
  const maxVal = Math.max(
    1,
    ...series.flatMap((r) => metrics.map((m) => Number(r[m]) || 0))
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Trend (counts / balances by period)</CardTitle>
        <p className="text-xs text-muted-foreground font-normal">
          Bars scale to the largest value in the table. Toggle metrics in the data grid below.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {series.map((row) => (
          <div key={row.period} className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{row.period}</span>
            </div>
            <div className="flex h-8 gap-1 items-end">
              {metrics.map((m) => {
                const v = Number(row[m]) || 0;
                const h = `${(v / maxVal) * 100}%`;
                return (
                  <div key={m} className="flex-1 flex flex-col justify-end group relative min-w-0">
                    <div
                      className="w-full rounded-sm bg-primary/80 min-h-[4px] transition-all"
                      style={{ height: h }}
                      title={`${m}: ${v}`}
                    />
                    <span className="text-[10px] text-center text-muted-foreground truncate capitalize">{m}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
