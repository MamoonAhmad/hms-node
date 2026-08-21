import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { patientApi } from '@/services/api';
import { formatMoney } from '@/pages/patients/patientChartConstants';

const SECTIONS = [
  { id: 'balanceDue', label: 'Balance due' },
  { id: 'expiredCoverage', label: 'Expired coverage' },
  { id: 'unverifiedEligibility', label: 'Eligibility stale/missing' },
  { id: 'incompleteRegistration', label: 'Incomplete registration' },
  { id: 'collections', label: 'Collections' },
];

export function PatientWorklistsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('balanceDue');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await patientApi.getWorklists({ limit: 100 });
      setData(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const rows = data?.[tab] || [];

  return (
    <div className="ehr-page space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Patient RCM Worklists"
        description="Balance due, coverage, eligibility, incomplete registration, and collections queues."
        actions={
          <Button type="button" variant="outline" onClick={load} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </Button>
        }
      />

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {data?.counts && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              className="rounded-lg border bg-card p-3 text-left hover:bg-muted/40"
              onClick={() => setTab(section.id)}
            >
              <p className="text-xs uppercase text-muted-foreground">{section.label}</p>
              <p className="mt-1 text-2xl font-semibold">{data.counts[section.id] ?? 0}</p>
            </button>
          ))}
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto flex-wrap gap-1">
          {SECTIONS.map((section) => (
            <TabsTrigger key={section.id} value={section.id}>
              {section.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {SECTIONS.map((section) => (
          <TabsContent key={section.id} value={section.id}>
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>MRN</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Billing</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Open</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Loading…
                      </TableCell>
                    </TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No patients in this queue
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => (
                      <TableRow key={`${section.id}-${row.id}-${row.reason || ''}`}>
                        <TableCell className="font-mono text-xs">{row.mrn}</TableCell>
                        <TableCell>
                          {[row.firstName, row.lastName].filter(Boolean).join(' ')}
                        </TableCell>
                        <TableCell className="capitalize">
                          {row.registrationStatus || row.chartStatus || '—'}
                          {row.reason ? ` · ${row.reason.replace(/_/g, ' ')}` : ''}
                        </TableCell>
                        <TableCell>{row.billingType || '—'}</TableCell>
                        <TableCell className="text-right">{formatMoney(row.accountBalance)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/patients/${row.id}`)}
                          >
                            Chart
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
