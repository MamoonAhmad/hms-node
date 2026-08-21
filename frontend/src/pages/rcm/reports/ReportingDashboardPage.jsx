import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  DollarSign,
  ExternalLink,
  FileWarning,
  LayoutDashboard,
  LineChart,
  PiggyBank,
  Scale,
  ShieldCheck,
  Stethoscope,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { rcmApi } from '@/services/api';

const REPORT_GROUPS = [
  {
    title: 'Revenue & A/R',
    description: 'Balances, cash, and payer mix',
    icon: DollarSign,
    gradient: 'from-primary to-teal-700',
    links: [
      { to: '/rcm/reports/claim-summary', label: 'Claim Summary' },
      { to: '/rcm/reports/aging', label: 'Aging' },
      { to: '/rcm/reports/payment-reconciliation', label: 'Payment Reconciliation' },
      { to: '/rcm/reports/insurance-payer-analysis', label: 'Payer Analysis' },
    ],
  },
  {
    title: 'Claims pipeline',
    description: 'Status, coding, and throughput',
    icon: LineChart,
    gradient: 'from-teal-600 to-teal-800',
    links: [
      { to: '/rcm/reports/claim-status', label: 'Claim Status' },
      { to: '/rcm/reports/encounter-visit', label: 'Encounter / Visit' },
      { to: '/rcm/reports/icd-cpt-mapping', label: 'ICD / CPT Mapping' },
      { to: '/rcm/reports/top-procedure', label: 'Top Procedures' },
    ],
  },
  {
    title: 'Adjustments & compliance',
    description: 'Write-offs, audits, and denials',
    icon: ShieldCheck,
    gradient: 'from-teal-500/90 to-emerald-600',
    links: [
      { to: '/rcm/reports/claim-adjustment', label: 'Claim Adjustments' },
      { to: '/rcm/reports/audit-compliance', label: 'Audit / Compliance' },
      { to: '/rcm/reports/denial', label: 'Denial Report' },
      { to: '/rcm/reports/provider-performance', label: 'Provider Performance' },
    ],
  },
  {
    title: 'Patient & billing documents',
    description: 'Statements and operational views',
    icon: Scale,
    gradient: 'from-orange-500/90 to-amber-600',
    links: [
      { to: '/rcm/reports/patient-statement-billing', label: 'Patient Statement / Billing' },
    ],
  },
];

export function ReportingDashboardPage() {
  const [cards, setCards] = useState([]);

  useEffect(() => {
    rcmApi
      .reportDashboard()
      .then((res) => setCards(res.data?.cards || []))
      .catch(() => setCards([]));
  }, []);

  const iconFor = (label) => {
    const l = String(label || '').toLowerCase();
    if (l.includes('ar')) return Wallet;
    if (l.includes('claim') || l.includes('flight')) return ClipboardList;
    if (l.includes('denial')) return FileWarning;
    if (l.includes('paid')) return PiggyBank;
    if (l.includes('era')) return BarChart3;
    if (l.includes('follow')) return Stethoscope;
    return LayoutDashboard;
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-muted/50 via-background to-background">
      <div className="mx-auto max-w-[1600px] space-y-8 px-4 py-8 sm:px-6 sm:py-10">
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:justify-between sm:p-8">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="font-normal text-muted-foreground">
                  Revenue cycle
                </Badge>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Live dashboard
                </span>
              </div>
              <div className="space-y-2">
                <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-foreground">
                  <LayoutDashboard className="h-8 w-8 text-primary" />
                  Reporting dashboard
                </h1>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Operational KPIs from claims, ERA, denials, follow-ups, and patient AR.
                </p>
              </div>
            </div>
            <Button asChild>
              <Link to="/rcm/claims">
                Open claims <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {(cards.length ? cards : [{ label: 'Loading…', value: '—' }]).map((card) => {
            const Icon = iconFor(card.label);
            return (
              <Card key={card.label} className="border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                  <Icon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold tabular-nums">{card.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {REPORT_GROUPS.map((group) => {
            const Icon = group.icon;
            return (
              <Card key={group.title}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className={cn('rounded-md bg-gradient-to-br p-2 text-white', group.gradient)}>
                      <Icon className="h-4 w-4" />
                    </span>
                    {group.title}
                  </CardTitle>
                  <CardDescription>{group.description}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2 sm:grid-cols-2">
                  {group.links.map((link) => (
                    <Button key={link.to} variant="outline" className="justify-between" asChild>
                      <Link to={link.to}>
                        {link.label}
                        <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                      </Link>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
