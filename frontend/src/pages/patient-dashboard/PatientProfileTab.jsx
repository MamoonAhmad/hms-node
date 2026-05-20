import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, Printer, FileText } from 'lucide-react';
import { buildPatientProfileBundle, downloadJson } from '@/pages/patient-dashboard/patientProfileBundle';
import { usePatientChart } from '@/pages/patient-dashboard/PatientChartContext';

function Section({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-4 break-inside-avoid print:break-inside-avoid">
      <Card className="border-border/80 shadow-sm print:border print:shadow-none print:rounded-md">
        <CardHeader className="border-b border-border/60 bg-muted/30 py-3 print:py-2">
          <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 text-sm print:pt-3 print:text-xs">{children}</CardContent>
      </Card>
    </section>
  );
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHtmlReport(bundle) {
  const rows = (arr, cols) =>
    arr
      .map(
        (row) =>
          `<tr>${cols.map((c) => `<td>${escapeHtml(row[c] ?? '—')}</td>`).join('')}</tr>`,
      )
      .join('');

  const b = bundle;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Patient profile — ${escapeHtml(b.demographics.mrn)}</title>
<style>
body{font-family:system-ui,sans-serif;margin:24px;color:#111;line-height:1.45}
h1{font-size:1.35rem;margin:0 0 4px}
.meta{color:#555;font-size:0.85rem;margin-bottom:24px}
h2{font-size:1rem;border-bottom:1px solid #ccc;padding-bottom:4px;margin:28px 0 10px}
table{width:100%;border-collapse:collapse;font-size:0.85rem;margin-bottom:8px}
th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}
th{background:#f3f4f6}
ul{margin:0;padding-left:1.2rem}
</style></head><body>
<h1>Patient profile export</h1>
<div class="meta">Generated ${escapeHtml(b.meta.generatedAt)} · MRN ${escapeHtml(b.demographics.mrn)}</div>

<h2>Demographics & summary</h2>
<p><strong>Name:</strong> ${escapeHtml(b.demographics.name)} · <strong>Age:</strong> ${escapeHtml(String(b.demographics.age))} · <strong>Gender:</strong> ${escapeHtml(b.demographics.gender)}</p>
<p><strong>Contact:</strong> ${escapeHtml(b.demographics.contact)}</p>
<p><strong>Address:</strong> ${escapeHtml(b.demographics.address)}</p>

<h2>Allergies</h2>
<table><thead><tr><th>Allergen</th><th>Severity</th><th>Reaction</th></tr></thead><tbody>
${rows(b.allergies, ['allergen', 'severity', 'reaction'])}
</tbody></table>

<h2>Medications</h2>
<table><thead><tr><th>Medication</th><th>Dose</th><th>Frequency</th></tr></thead><tbody>
${rows(b.medications, ['name', 'dose', 'frequency'])}
</tbody></table>

<h2>Conditions</h2>
<ul>${b.conditions.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}</ul>

<h2>Orders</h2>
<table><thead><tr><th>ID</th><th>Type</th><th>Name</th><th>Status</th></tr></thead><tbody>
${rows(b.orders, ['id', 'type', 'name', 'status'])}
</tbody></table>

<h2>Clinical notes</h2>
<table><thead><tr><th>Date</th><th>Type</th><th>Author</th><th>Summary</th></tr></thead><tbody>
${b.clinicalNotes.map((n) => `<tr><td>${escapeHtml(n.date)}</td><td>${escapeHtml(n.type)}</td><td>${escapeHtml(n.author)}</td><td>${escapeHtml(n.summary)}</td></tr>`).join('')}
</tbody></table>

<h2>Appointments</h2>
<table><thead><tr><th>Date</th><th>Time</th><th>Type</th><th>Provider</th><th>Status</th></tr></thead><tbody>
${rows(b.appointments, ['date', 'time', 'type', 'provider', 'status'])}
</tbody></table>

<h2>Documents</h2>
<table><thead><tr><th>Name</th><th>Category</th><th>Uploaded</th></tr></thead><tbody>
${rows(b.documents, ['name', 'category', 'uploadedOn'])}
</tbody></table>

<h2>Results snapshot</h2>
<table><thead><tr><th>Test</th><th>Date</th><th>Summary</th></tr></thead><tbody>
${rows(b.results, ['name', 'date', 'value'])}
</tbody></table>

<h2>Billing summary</h2>
<p><strong>Open balance:</strong> ${escapeHtml(b.billing.openBalance)}</p>
</body></html>`;
}

export function PatientProfileTab() {
  const { patient, appointments, orders } = usePatientChart();
  const bundle = useMemo(
    () => buildPatientProfileBundle({ patient, appointments, orders }),
    [patient, appointments, orders],
  );

  const handleDownloadAll = () => {
    const safeMrn = bundle.demographics.mrn.replace(/[^a-zA-Z0-9-_]/g, '_');
    const stamp = new Date().toISOString().slice(0, 10);
    downloadJson(`patient-profile-${safeMrn}-${stamp}.json`, bundle);
  };

  const handleDownloadHtml = () => {
    const html = buildHtmlReport(bundle);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patient-profile-${bundle.demographics.mrn.replace(/[^a-zA-Z0-9-_]/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintAll = () => {
    window.print();
  };

  const { demographics, meta } = bundle;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patient profile</h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-3xl">
            Consolidated record for chart review, legal, or care coordination. Use <strong>Download all</strong> for
            machine-readable JSON and HTML, or <strong>Print all</strong> for a formatted paper copy.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {patient?.id && patient.id !== 'sample' && (
            <Button variant="outline" className="gap-2" asChild>
              <Link to={`/patients/edit/${patient.id}`}>Edit registration</Link>
            </Button>
          )}
          <Button type="button" variant="default" className="gap-2" onClick={handleDownloadAll}>
            <Download className="h-4 w-4" />
            Download all (JSON)
          </Button>
          <Button type="button" variant="secondary" className="gap-2" onClick={handleDownloadHtml}>
            <FileText className="h-4 w-4" />
            Download all (HTML)
          </Button>
          <Button type="button" variant="outline" className="gap-2" onClick={handlePrintAll}>
            <Printer className="h-4 w-4" />
            Print all
          </Button>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
@media print {
  @page { margin: 12mm; size: auto; }
  #root { visibility: hidden !important; }
  #patient-profile-print-root {
    visibility: visible !important;
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    background: white !important;
    color: black !important;
    padding: 0 8px 16px !important;
  }
  #patient-profile-print-root * {
    visibility: visible !important;
    color: inherit;
  }
  #patient-profile-print-root .text-muted-foreground {
    color: #444 !important;
  }
}`,
        }}
      />

      <div id="patient-profile-print-root" className="space-y-6 print:space-y-4">
        <div className="hidden border-b-2 border-foreground/80 pb-3 print:block">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Patient profile — full record</p>
          <p className="text-2xl font-bold">{demographics.name}</p>
          <p className="text-sm font-mono text-muted-foreground">
            {demographics.mrn} · Generated {meta.generatedAt}
          </p>
        </div>

        <div className="rounded-lg border bg-card px-4 py-3 print:border print:rounded-md">
          <p className="text-xs text-muted-foreground print:text-gray-600">
            Generated <span className="font-mono">{meta.generatedAt}</span>
            {' · '}
            Patient <span className="font-mono">{meta.patientId}</span>
          </p>
          <p className="text-lg font-semibold text-foreground print:text-black mt-1">
            {demographics.name}{' '}
            <span className="text-muted-foreground font-normal text-base print:text-gray-700">
              ({demographics.mrn})
            </span>
          </p>
        </div>

        <Section id="profile-demographics" title="Patient summary & demographics">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground text-xs uppercase tracking-wide">Age / gender</dt>
              <dd className="font-medium">
                {demographics.age} / {demographics.gender}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs uppercase tracking-wide">Contact</dt>
              <dd className="font-medium">{demographics.contact}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground text-xs uppercase tracking-wide">Address</dt>
              <dd>{demographics.address}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs uppercase tracking-wide">Language</dt>
              <dd>{demographics.preferredLanguage}</dd>
            </div>
          </dl>
          <div className="mt-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Alerts</p>
            <ul className="flex flex-wrap gap-2">
              {bundle.alerts.map((a, i) => (
                <li key={i}>
                  <Badge variant="outline">{a.type}</Badge>
                  <span className="ml-1.5 text-muted-foreground">{a.message}</span>
                </li>
              ))}
            </ul>
          </div>
        </Section>

        <Section id="profile-allergies" title="Allergies & medications">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Allergies</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Allergen</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Reaction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bundle.allergies.map((a, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{a.allergen}</TableCell>
                      <TableCell>{a.severity}</TableCell>
                      <TableCell>{a.reaction}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Medications</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medication</TableHead>
                    <TableHead>Dose</TableHead>
                    <TableHead>Frequency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bundle.medications.map((m, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell>{m.dose}</TableCell>
                      <TableCell>{m.frequency}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Problem list</p>
              <ul className="list-disc list-inside text-muted-foreground">
                {bundle.conditions.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        <Section id="profile-insurance" title="Insurance">
          <dl className="grid gap-2 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Primary payer</dt>
              <dd className="font-medium">{bundle.insurance.primary}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Member ID</dt>
              <dd className="font-mono">{bundle.insurance.memberId}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Group</dt>
              <dd>{bundle.insurance.group}</dd>
            </div>
          </dl>
        </Section>

        <Section id="profile-orders" title="Orders">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Result / notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bundle.orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.id}</TableCell>
                  <TableCell>{o.type}</TableCell>
                  <TableCell className="font-medium">{o.name}</TableCell>
                  <TableCell>{o.status}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground max-w-md">
                    {o.resultSummary}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>

        <Section id="profile-notes" title="Clinical notes">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Summary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bundle.clinicalNotes.map((n) => (
                <TableRow key={n.id}>
                  <TableCell>{n.date}</TableCell>
                  <TableCell>{n.type}</TableCell>
                  <TableCell>{n.author}</TableCell>
                  <TableCell>{n.status}</TableCell>
                  <TableCell className="max-w-lg text-muted-foreground">{n.summary}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>

        <Section id="profile-appointments" title="Appointment details">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bundle.appointments.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-xs">{a.id}</TableCell>
                  <TableCell>{a.date}</TableCell>
                  <TableCell>{a.time}</TableCell>
                  <TableCell>{a.type}</TableCell>
                  <TableCell>{a.provider}</TableCell>
                  <TableCell>{a.location}</TableCell>
                  <TableCell>{a.status}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{a.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>

        <Section id="profile-documents" title="Patient documents">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Format</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bundle.documents.map((d, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell>{d.category}</TableCell>
                  <TableCell>{d.uploadedOn}</TableCell>
                  <TableCell>{d.format}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>

        <Section id="profile-results" title="Results">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Flag</TableHead>
                <TableHead>Value / comment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bundle.results.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell>{r.flag || '—'}</TableCell>
                  <TableCell>{r.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>

        <Section id="profile-billing" title="Billing snapshot">
          <p className="text-base font-semibold mb-2">Open balance: {bundle.billing.openBalance}</p>
          <p className="text-sm text-muted-foreground mb-3">
            Last statement: {bundle.billing.lastStatementDate}
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bundle.billing.recentCharges.map((c, i) => (
                <TableRow key={i}>
                  <TableCell>{c.date}</TableCell>
                  <TableCell>{c.description}</TableCell>
                  <TableCell className="text-right font-mono">{c.amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>

        <p className="text-center text-xs text-muted-foreground print:text-gray-500 pt-4 print:pt-2">
          End of patient profile — exported {new Date(bundle.meta.generatedAt).toLocaleString()}.
        </p>
      </div>
    </div>
  );
}
