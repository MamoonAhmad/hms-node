import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  BarChart3,
  ChevronRight,
  ClipboardList,
  DollarSign,
  ExternalLink,
  FileWarning,
  LayoutDashboard,
  LineChart,
  PiggyBank,
  Scale,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const KPI_CARDS = [
  {
    id: 'ar',
    label: 'Open A/R (est.)',
    value: '$428,600',
    delta: '+2.4% vs prior 30d',
    trend: 'up',
    icon: Wallet,
    cardTint: 'border-sky-500/25 bg-gradient-to-br from-sky-500/[0.08] to-transparent',
    stripe: 'from-sky-500 to-sky-400',
    iconBg: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  },
  {
    id: 'submitted',
    label: 'Claims submitted (30d)',
    value: '1,284',
    delta: '+6.1% vs prior 30d',
    trend: 'up',
    icon: ClipboardList,
    cardTint: 'border-violet-500/25 bg-gradient-to-br from-violet-500/[0.08] to-transparent',
    stripe: 'from-violet-500 to-violet-400',
    iconBg: 'bg-violet-500/15 text-violet-700 dark:text-violet-400',
  },
  {
    id: 'denial',
    label: 'Denial rate',
    value: '5.2%',
    delta: '−0.6 pts vs prior 30d',
    trend: 'down',
    icon: FileWarning,
    cardTint: 'border-amber-500/30 bg-gradient-to-br from-amber-500/[0.1] to-transparent',
    stripe: 'from-amber-500 to-amber-400',
    iconBg: 'bg-amber-500/15 text-amber-800 dark:text-amber-400',
  },
  {
    id: 'collections',
    label: 'Net collections (30d)',
    value: '$312,400',
    delta: '+4.8% vs prior 30d',
    trend: 'up',
    icon: PiggyBank,
    cardTint: 'border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.08] to-transparent',
    stripe: 'from-emerald-500 to-emerald-400',
    iconBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  },
  {
    id: 'dpt',
    label: 'Avg. days to pay',
    value: '27',
    delta: '−2 days vs prior 30d',
    trend: 'down',
    icon: TrendingUp,
    cardTint: 'border-primary/25 bg-gradient-to-br from-primary/[0.08] to-transparent',
    stripe: 'from-primary to-primary/70',
    iconBg: 'bg-primary/15 text-primary',
  },
];

const SNAPSHOT_BARS = [
  { label: 'Billed', pct: 100, value: '$520k', barClass: 'bg-sky-500 dark:bg-sky-500' },
  { label: 'Adjusted', pct: 78, value: '$406k', barClass: 'bg-violet-500 dark:bg-violet-500' },
  { label: 'Collected', pct: 62, value: '$322k', barClass: 'bg-emerald-500 dark:bg-emerald-500' },
];

const WORKFLOW_ITEMS = [
  {
    label: 'Draft / not submitted',
    count: 23,
    href: '/rcm/reports/claim-status',
    tone: 'muted',
    sub: 'Status report',
  },
  {
    label: 'Rejected (clearinghouse)',
    count: 12,
    href: '/rcm/reports/rejected-claims-summary',
    tone: 'destructive',
    sub: 'Fix & resubmit',
  },
  {
    label: 'Denied (adjudicated)',
    count: 41,
    href: '/rcm/reports/denial',
    tone: 'amber',
    sub: 'Appeals queue',
  },
  {
    label: 'Pending auth',
    count: 18,
    href: '/rcm/reports/pending-authorizations',
    tone: 'muted',
    sub: 'Expiring soon',
  },
];

const REPORT_GROUPS = [
  {
    title: 'Revenue & A/R',
    description: 'Balances, cash, and payer mix',
    icon: DollarSign,
    gradient: 'from-sky-500/90 to-blue-600',
    links: [
      { to: '/rcm/reports/claim-summary', label: 'Claim Summary' },
      { to: '/rcm/reports/aging', label: 'Aging' },
      { to: '/rcm/reports/patient-balance', label: 'Patient Balance' },
      { to: '/rcm/reports/payment-reconciliation', label: 'Payment Reconciliation' },
      { to: '/rcm/reports/insurance-payer-analysis', label: 'Payer Analysis' },
      { to: '/rcm/reports/revenue-by-department-facility', label: 'Revenue by Dept / Facility' },
    ],
  },
  {
    title: 'Claims pipeline',
    description: 'Status, coding, and throughput',
    icon: LineChart,
    gradient: 'from-violet-500/90 to-purple-600',
    links: [
      { to: '/rcm/reports/claim-status', label: 'Claim Status' },
      { to: '/rcm/reports/claim-trend', label: 'Claim Trend' },
      { to: '/rcm/reports/encounter-visit', label: 'Encounter / Visit' },
      { to: '/rcm/reports/icd-cpt-mapping', label: 'ICD / CPT Mapping' },
      { to: '/rcm/reports/top-procedure', label: 'Top Procedures' },
      { to: '/rcm/reports/duplicate-claims', label: 'Duplicate Claims' },
    ],
  },
  {
    title: 'Adjustments & compliance',
    description: 'Write-offs, audits, and attachments',
    icon: ShieldCheck,
    gradient: 'from-teal-500/90 to-emerald-600',
    links: [
      { to: '/rcm/reports/claim-adjustment', label: 'Claim Adjustments' },
      { to: '/rcm/reports/write-off-adjustment-analysis', label: 'Write-Off Analysis' },
      { to: '/rcm/reports/audit-compliance', label: 'Audit / Compliance' },
      { to: '/rcm/reports/provider-compliance', label: 'Provider Compliance' },
      { to: '/rcm/reports/attachment-document', label: 'Attachments' },
    ],
  },
  {
    title: 'Patient & billing documents',
    description: 'Statements and operational views',
    icon: Scale,
    gradient: 'from-orange-500/90 to-amber-600',
    links: [
      { to: '/rcm/reports/patient-statement-billing', label: 'Patient Statement / Billing' },
      { to: '/rcm/reports/provider-performance', label: 'Provider Performance' },
      { to: '/rcm/reports/claim-resubmission', label: 'Claim Resubmission' },
    ],
  },
];

function DeltaBadge({ good, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums',
        good
          ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400'
          : 'bg-muted/80 text-muted-foreground'
      )}
    >
      {good ? <TrendingUp className="h-3 w-3 shrink-0" /> : null}
      {children}
    </span>
  );
}

export function ReportingDashboardPage() {
  return (
    <div className="min-h-full bg-gradient-to-b from-muted/50 via-background to-background">
      <div className="mx-auto max-w-[1600px] space-y-8 px-4 py-8 sm:px-6 sm:py-10">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.09] via-transparent to-transparent"
            aria-hidden
          />
          <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:justify-between sm:p-8">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="font-normal text-muted-foreground">
                  Revenue cycle
                </Badge>
                <span className="text-muted-foreground/60">·</span>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Reporting
                </span>
              </div>
              <div className="space-y-2">
                <h1 className="flex flex-wrap items-center gap-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
                    <LayoutDashboard className="h-6 w-6" aria-hidden />
                  </span>
                  Reporting dashboard
                </h1>
                <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
                  At-a-glance KPIs, workflow shortcuts, and grouped access to every claims report. Sample metrics—wire to
                  your APIs when ready.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Badge className="gap-1.5 rounded-md px-2.5 py-1 font-normal" variant="outline">
                  <Sparkles className="h-3.5 w-3.5" />
                  Last 30 days
                </Badge>
                <span className="text-muted-foreground">
                  Updated <time dateTime={new Date().toISOString()}>{new Date().toLocaleString()}</time>
                </span>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              <Button size="lg" className="w-full shadow-md sm:w-auto" asChild>
                <Link to="/rcm/reports/claim-summary">
                  <BarChart3 className="h-4 w-4" />
                  Claim summary report
                </Link>
              </Button>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button variant="outline" className="w-full sm:w-auto" asChild>
                  <Link to="/rcm/claims">
                    <Stethoscope className="h-4 w-4" />
                    Claims listing
                  </Link>
                </Button>
                <Button variant="outline" className="w-full sm:w-auto" asChild>
                  <Link to="/rcm/claim-tracker">
                    <ExternalLink className="h-4 w-4" />
                    Claim tracker
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Attention banner */}
        <div
          className="flex gap-4 rounded-2xl border border-amber-500/35 bg-gradient-to-r from-amber-500/12 via-amber-500/8 to-transparent px-5 py-4 shadow-sm dark:from-amber-500/15 dark:via-amber-500/10"
          role="status"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-800 dark:text-amber-200">
            <FileWarning className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="font-semibold text-foreground">Action needed this week</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              <strong className="text-foreground">12</strong> clearinghouse rejections and{' '}
              <strong className="text-foreground">41</strong> payer denials are waiting on follow-up. Use the workflow
              panel below to jump to the right report.
            </p>
          </div>
        </div>

        {/* KPIs */}
        <section aria-labelledby="kpi-heading">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 id="kpi-heading" className="text-lg font-semibold tracking-tight text-foreground">
                Key metrics
              </h2>
              <p className="text-sm text-muted-foreground">Illustrative values for layout preview</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {KPI_CARDS.map((k) => {
              const Icon = k.icon;
              const good =
                (k.trend === 'up' && ['collections', 'submitted'].includes(k.id)) ||
                (k.trend === 'down' && ['denial', 'dpt'].includes(k.id));
              return (
                <Card
                  key={k.id}
                  className={cn(
                    'group relative overflow-hidden border bg-card/90 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md',
                    k.cardTint
                  )}
                >
                  <div
                    className={cn('absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r opacity-90', k.stripe)}
                    aria-hidden
                  />
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-5">
                    <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {k.label}
                    </CardTitle>
                    <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', k.iconBg)}>
                      <Icon className="h-4 w-4" aria-hidden />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pb-5">
                    <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-[1.65rem]">
                      {k.value}
                    </p>
                    <DeltaBadge good={good}>{k.delta}</DeltaBadge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Snapshot + Workflow */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden border-border/60 shadow-sm">
            <CardHeader className="border-b border-border/50 bg-muted/30 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-lg">Financial snapshot</CardTitle>
                  <CardDescription>Billed → adjusted → collected for the period</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {SNAPSHOT_BARS.map((row) => (
                <div key={row.label} className="space-y-2">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="font-medium text-foreground">{row.label}</span>
                    <span className="tabular-nums text-muted-foreground">{row.value}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', row.barClass)}
                      style={{ width: `${row.pct}%` }}
                      role="progressbar"
                      aria-valuenow={row.pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                </div>
              ))}
              <Button variant="secondary" className="w-full" asChild>
                <Link to="/rcm/reports/revenue-by-department-facility">
                  Revenue by department / facility
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/60 shadow-sm">
            <CardHeader className="border-b border-border/50 bg-muted/30 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ClipboardList className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-lg">Workflow queue</CardTitle>
                  <CardDescription>Sample counts — connect to live work queues</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 p-4 sm:p-6">
              {WORKFLOW_ITEMS.map((w) => (
                <Link
                  key={w.label}
                  to={w.href}
                  className={cn(
                    'group flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-all',
                    'hover:border-primary/30 hover:bg-muted/50 hover:shadow-sm',
                    w.tone === 'destructive' &&
                      'border-destructive/25 bg-destructive/[0.06] hover:border-destructive/40',
                    w.tone === 'amber' && 'border-amber-500/30 bg-amber-500/[0.06] hover:border-amber-500/45',
                    w.tone === 'muted' && 'border-border/80 bg-card'
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground group-hover:text-primary">{w.label}</p>
                    <p className="text-xs text-muted-foreground">{w.sub}</p>
                  </div>
                  <span
                    className={cn(
                      'flex h-9 min-w-9 items-center justify-center rounded-full px-2.5 text-sm font-bold tabular-nums',
                      w.tone === 'destructive' && 'bg-destructive/15 text-destructive',
                      w.tone === 'amber' && 'bg-amber-500/15 text-amber-900 dark:text-amber-200',
                      w.tone === 'muted' && 'bg-muted text-foreground'
                    )}
                  >
                    {w.count}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              ))}
              <Button variant="outline" className="mt-2 w-full border-dashed" asChild>
                <Link to="/rcm/claim-tracker">Open full claim tracker</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Report directory */}
        <section aria-labelledby="reports-heading" className="space-y-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="reports-heading" className="text-xl font-semibold tracking-tight text-foreground">
                Report library
              </h2>
              <p className="text-sm text-muted-foreground">Open any report — same filters and exports as from the sidebar</p>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {REPORT_GROUPS.map((group) => {
              const GIcon = group.icon;
              return (
                <Card
                  key={group.title}
                  className="overflow-hidden border-border/60 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className={cn('h-1.5 w-full bg-gradient-to-r', group.gradient)} aria-hidden />
                  <CardHeader className="pb-3 pt-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                        <GIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <CardTitle className="text-base leading-snug">{group.title}</CardTitle>
                        <CardDescription className="text-xs leading-relaxed">{group.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-5 pt-0">
                    <ul className="divide-y divide-border/60 rounded-xl border border-border/60 bg-muted/20">
                      {group.links.map((l) => (
                        <li key={l.to}>
                          <Link
                            to={l.to}
                            className="group/row flex items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-background hover:text-primary"
                          >
                            <span className="min-w-0 truncate">{l.label}</span>
                            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/row:opacity-100 group-hover/row:text-primary" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
