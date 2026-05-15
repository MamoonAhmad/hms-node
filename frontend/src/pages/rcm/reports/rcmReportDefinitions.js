/**
 * RCM report UI definitions (sample rows for preview). Wire to API later.
 * Keys must match Sidebar hrefs: /rcm/reports/:slug
 */

const currency = { format: 'currency', numeric: true, sortable: true, align: 'right' };
const text = { sortable: true };
const right = { align: 'right', sortable: true };

function sc(id, label, value) {
  return { id, label, value };
}

export const REPORT_DEFINITIONS = {
  'claim-summary': {
    title: 'Claim Summary Report',
    description:
      'High-level volume and financial snapshot of claims for the selected period. Summary totals align with the detail grid for the same filters.',
    dateFilterLabel: 'Date range',
    dateFilterHint: 'DOS (date of service)',
    helpRule: 'Each claim appears once in the detail grid; footer totals sum numeric columns for displayed rows.',
    columns: [
      { key: 'claimId', label: 'Claim ID', ...text },
      { key: 'patient', label: 'Patient', ...text },
      { key: 'dos', label: 'DOS', ...text },
      { key: 'payer', label: 'Payer', ...text },
      { key: 'billed', label: 'Billed', ...currency },
      { key: 'paid', label: 'Paid', ...currency },
      { key: 'adjustment', label: 'Adjustment', ...currency },
      { key: 'balance', label: 'Balance', ...currency },
      { key: 'status', label: 'Status', ...text },
    ],
    rows: [
      { id: '1', claimId: 'CLM-2025-014', patient: 'Doe, John', dos: '2025-03-01', payer: 'BCBS', billed: 450, paid: 380, adjustment: 20, balance: 50, status: 'Partial payment' },
      { id: '2', claimId: 'CLM-2025-022', patient: 'Smith, Mary', dos: '2025-03-02', payer: 'Aetna', billed: 220, paid: 220, adjustment: 0, balance: 0, status: 'Paid' },
      { id: '3', claimId: 'CLM-2025-031', patient: 'Lee, Ann', dos: '2025-03-04', payer: 'UHC', billed: 890, paid: 0, adjustment: 0, balance: 890, status: 'Submitted' },
    ],
    summaryCards: [
      sc('t1', 'Total claims', '3'),
      sc('t2', 'Total billed', '$1,560.00'),
      sc('t3', 'Total paid', '$600.00'),
      sc('t4', 'Total adjustments', '$20.00'),
      sc('t5', 'Net balance', '$940.00'),
    ],
    numericFooterKeys: ['billed', 'paid', 'adjustment', 'balance'],
  },

  'claim-status': {
    title: 'Claim Status Report',
    description:
      'Pipeline visibility across adjudication states. Date filter can represent submission date or DOS—confirm with your billing policy.',
    dateFilterLabel: 'Date basis',
    dateFilterHint: 'Submission date (or toggle in future: DOS)',
    helpRule: 'Business rule: each claim has one primary status for reporting. Denied and appealed are mutually exclusive stages in this sample.',
    columns: [
      { key: 'claimId', label: 'Claim ID', ...text },
      { key: 'patient', label: 'Patient', ...text },
      { key: 'dos', label: 'DOS', ...text },
      { key: 'status', label: 'Current status', ...text },
      { key: 'statusDate', label: 'Status date', ...text },
      { key: 'payer', label: 'Payer', ...text },
      { key: 'amount', label: 'Amount', ...currency },
      { key: 'nextAction', label: 'Next action / owner', ...text },
    ],
    rows: [
      { id: '1', claimId: 'CLM-2025-010', patient: 'Doe, John', dos: '2025-02-10', status: 'Submitted', statusDate: '2025-02-11', payer: 'BCBS', amount: 300, nextAction: 'Payer review — Billing' },
      { id: '2', claimId: 'CLM-2025-011', patient: 'Smith, Mary', dos: '2025-02-12', status: 'Paid', statusDate: '2025-02-20', payer: 'Aetna', amount: 175, nextAction: '—' },
      { id: '3', claimId: 'CLM-2025-012', patient: 'Garcia, Luis', dos: '2025-02-14', status: 'Denied', statusDate: '2025-02-18', payer: 'UHC', amount: 410, nextAction: 'Appeal draft — RCM' },
    ],
    summaryCards: [],
    breakdown: [
      { label: 'Submitted', count: 12, amount: 12400, pct: 35 },
      { label: 'Pending', count: 6, amount: 5100, pct: 18 },
      { label: 'Paid', count: 28, amount: 45200, pct: 42 },
      { label: 'Denied', count: 4, amount: 3200, pct: 12 },
      { label: 'Appealing', count: 2, amount: 900, pct: 5 },
    ],
    numericFooterKeys: ['amount'],
  },

  'patient-statement-billing': {
    title: 'Patient Statement / Billing Report',
    description:
      'Internal preview of patient-responsible balances suitable for statement generation. Export CSV; use Print / PDF for a statement-style layout.',
    dateFilterLabel: 'Service / activity range',
    dateFilterHint: 'Charges with open balance in range',
    showPdfExport: true,
    footNote: 'Running total per patient should equal the sum of line balances when wired to live data.',
    columns: [
      { key: 'patient', label: 'Patient', ...text },
      { key: 'account', label: 'Account #', ...text },
      { key: 'dos', label: 'DOS', ...text },
      { key: 'cpt', label: 'CPT', ...text },
      { key: 'description', label: 'Description', ...text },
      { key: 'charge', label: 'Charge', ...currency },
      { key: 'payments', label: 'Payments', ...currency },
      { key: 'adjustments', label: 'Adjustments', ...currency },
      { key: 'balance', label: 'Balance', ...currency },
      { key: 'aging', label: 'Aging bucket', ...text },
    ],
    rows: [
      { id: '1', patient: 'Doe, John', account: 'A-10091', dos: '2025-01-05', cpt: '99213', description: 'Office visit', charge: 180, payments: 40, adjustments: 20, balance: 120, aging: '31–60' },
      { id: '2', patient: 'Doe, John', account: 'A-10091', dos: '2025-02-02', cpt: '80053', description: 'Lab panel', charge: 95, payments: 0, adjustments: 0, balance: 95, aging: '0–30' },
      { id: '3', patient: 'Smith, Mary', account: 'A-10202', dos: '2025-02-20', cpt: '99214', description: 'Office visit', charge: 240, payments: 240, adjustments: 0, balance: 0, aging: 'Current' },
    ],
    summaryCards: [sc('s1', 'Patients in scope', '2'), sc('s2', 'Total patient balance', '$215.00')],
    numericFooterKeys: ['charge', 'payments', 'adjustments', 'balance'],
  },

  'provider-performance': {
    title: 'Provider Performance Report',
    description: 'Productivity and revenue attribution by rendering / billing provider (summary row per provider).',
    dateFilterLabel: 'Date range',
    dateFilterHint: 'DOS',
    columns: [
      { key: 'provider', label: 'Provider', ...text },
      { key: 'department', label: 'Department', ...text },
      { key: 'claims', label: 'Claim count', ...right, numeric: true, sortable: true },
      { key: 'encounters', label: 'Encounters', ...right, numeric: true, sortable: true },
      { key: 'units', label: 'Units', ...right, numeric: true, sortable: true },
      { key: 'gross', label: 'Gross charges', ...currency },
      { key: 'collections', label: 'Collections', ...currency },
      { key: 'rate', label: 'Collection rate', ...text },
      { key: 'dpt', label: 'Avg days to pay', ...right, numeric: true, sortable: true },
    ],
    rows: [
      { id: '1', provider: 'Dr. Jane Smith', department: 'Family Med', claims: 142, encounters: 138, units: 156, gross: 48200, collections: 40100, rate: '83%', dpt: 24 },
      { id: '2', provider: 'Dr. Alan Ruiz', department: 'Family Med', claims: 98, encounters: 96, units: 102, gross: 31500, collections: 26800, rate: '85%', dpt: 19 },
    ],
    summaryCards: [sc('a', 'Providers', '2'), sc('b', 'Total collections', '$66,900')],
    numericFooterKeys: ['claims', 'encounters', 'units', 'gross', 'collections', 'dpt'],
    footNote: 'Drill-down to claim level will be available when linked to the claims listing.',
  },

  denial: {
    title: 'Denial Report',
    description: 'Denied claim lines with payer reason codes for remediation and resubmission tracking.',
    dateFilterLabel: 'Date range',
    dateFilterHint: 'Denial date',
    columns: [
      { key: 'claimId', label: 'Claim ID', ...text },
      { key: 'line', label: 'Line', ...right, numeric: true, sortable: true },
      { key: 'cpt', label: 'CPT', ...text },
      { key: 'codes', label: 'Denial code(s)', ...text },
      { key: 'description', label: 'Description', ...text },
      { key: 'deniedAmt', label: 'Denied amount', ...currency },
      { key: 'payer', label: 'Payer', ...text },
      { key: 'resubmit', label: 'Resubmission status', ...text },
    ],
    rows: [
      { id: '1', claimId: 'CLM-2025-040', line: 1, cpt: '99285', codes: 'CO-50', description: 'Not covered', deniedAmt: 600, payer: 'UHC', resubmit: 'In progress' },
      { id: '2', claimId: 'CLM-2025-041', line: 2, cpt: '36415', codes: 'PR-96', description: 'Non-covered charge', deniedAmt: 25, payer: 'BCBS', resubmit: 'Not started' },
    ],
    summaryCards: [sc('d1', 'Denied lines', '2'), sc('d2', 'Denied dollars', '$625.00')],
    breakdown: [
      { label: 'CO-50 Not covered', count: 14, amount: 8200, pct: 40 },
      { label: 'PR-96 Non-covered', count: 9, amount: 2100, pct: 28 },
      { label: 'CO-16 Bundled', count: 6, amount: 1500, pct: 18 },
      { label: 'Other', count: 7, amount: 1800, pct: 14 },
    ],
    numericFooterKeys: ['line', 'deniedAmt'],
  },

  'payment-reconciliation': {
    title: 'Payment Reconciliation Report',
    description: 'Deposits and ERAs matched to claim applications. Rows where applied + unapplied ≠ payment amount are highlighted.',
    dateFilterLabel: 'Date range',
    dateFilterHint: 'Payment / deposit date',
    columns: [
      { key: 'batch', label: 'Payment batch', ...text },
      { key: 'payer', label: 'Payer', ...text },
      { key: 'payment', label: 'Payment amount', ...currency },
      { key: 'applied', label: 'Applied', ...currency },
      { key: 'unapplied', label: 'Unapplied', ...currency },
      { key: 'claims', label: 'Claim IDs touched', ...text },
      { key: 'posted', label: 'Posting date', ...text },
      { key: 'user', label: 'Posted by', ...text },
    ],
    rows: [
      { id: '1', batch: 'ERA-77821', payer: 'BCBS', payment: 12500, applied: 11800, unapplied: 700, claims: 'CLM-101, CLM-102', posted: '2025-03-10', user: 'jdoe' },
      { id: '2', batch: 'CHK-4412', payer: 'Aetna', payment: 3200, applied: 2900, unapplied: 250, claims: 'CLM-200', posted: '2025-03-11', user: 'asmith', _highlight: true },
    ],
    summaryCards: [
      sc('p1', 'Payments received', '$15,700.00'),
      sc('p2', 'Total applied', '$14,700.00'),
      sc('p3', 'Unapplied', '$950.00'),
    ],
    numericFooterKeys: ['payment', 'applied', 'unapplied'],
    helpRule: 'Highlighted rows need balance review (sample: applied + unapplied does not equal payment).',
  },

  'icd-cpt-mapping': {
    title: 'ICD / CPT Mapping Report',
    description: 'Coding usage per encounter/claim for medical necessity and data quality. Export includes full code lists per line.',
    dateFilterLabel: 'Date range',
    dateFilterHint: 'DOS (or claim date — configure in backend)',
    columns: [
      { key: 'encounter', label: 'Encounter / Claim', ...text },
      { key: 'icd', label: 'ICD-10', ...text },
      { key: 'cpt', label: 'CPT / HCPCS', ...text },
      { key: 'mod', label: 'Modifiers', ...text },
      { key: 'units', label: 'Units', ...right, numeric: true, sortable: true },
      { key: 'billed', label: 'Billed', ...currency },
      { key: 'payer', label: 'Payer', ...text },
    ],
    rows: [
      { id: '1', encounter: 'ENC-9001 / CLM-55', icd: 'J06.9; R50.9', cpt: '99214', mod: '—', units: 1, billed: 240, payer: 'BCBS' },
      { id: '2', encounter: 'ENC-9002 / CLM-56', icd: 'E11.9', cpt: '83036', mod: 'QW', units: 1, billed: 45, payer: 'Aetna' },
    ],
    summaryCards: [sc('m1', 'Encounters', '2'), sc('m2', 'Orphan CPT (no ICD)', '0')],
    numericFooterKeys: ['units', 'billed'],
  },

  'encounter-visit': {
    title: 'Encounter / Visit Report',
    description: 'Clinical visit log linked to billing. Filter unbilled visits when the backend exposes encounter claim linkage.',
    dateFilterLabel: 'Date range',
    dateFilterHint: 'Encounter date (DOS)',
    columns: [
      { key: 'encounterId', label: 'Encounter ID', ...text },
      { key: 'patient', label: 'Patient', ...text },
      { key: 'dos', label: 'DOS', ...text },
      { key: 'provider', label: 'Provider', ...text },
      { key: 'pos', label: 'Place of service', ...text },
      { key: 'dx', label: 'Diagnoses', ...text },
      { key: 'proc', label: 'Procedures', ...text },
      { key: 'claimCreated', label: 'Claim created', ...text },
      { key: 'claimId', label: 'Claim ID', ...text },
    ],
    rows: [
      { id: '1', encounterId: 'ENC-12001', patient: 'Doe, John', dos: '2025-03-05', provider: 'Dr. Smith', pos: '11 - Office', dx: 'J06.9', proc: '99213', claimCreated: 'Y', claimId: 'CLM-300' },
      { id: '2', encounterId: 'ENC-12002', patient: 'Nguyen, Kim', dos: '2025-03-06', provider: 'Dr. Ruiz', pos: '11 - Office', dx: 'M54.5', proc: '99214', claimCreated: 'N', claimId: '—' },
    ],
    summaryCards: [sc('e1', 'Encounters', '2'), sc('e2', 'Unbilled (sample)', '1')],
  },

  aging: {
    title: 'Aging Report',
    description: 'Accounts receivable by aging bucket as of the selected date.',
    dateFilterLabel: 'Reporting',
    dateFilterHint: 'Balances as of as-of date',
    showAsOfDate: true,
    columns: [
      { key: 'account', label: 'Account / Claim', ...text },
      { key: 'patient', label: 'Patient', ...text },
      { key: 'payer', label: 'Payer', ...text },
      { key: 'bucket', label: 'Bucket', ...text },
      { key: 'original', label: 'Original charge', ...currency },
      { key: 'payments', label: 'Payments', ...currency },
      { key: 'balance', label: 'Current balance', ...currency },
    ],
    rows: [
      { id: '1', account: 'CLM-400', patient: 'Doe, John', payer: 'BCBS', bucket: '0–30', original: 500, payments: 100, balance: 400 },
      { id: '2', account: 'CLM-401', patient: 'Smith, Mary', payer: 'Aetna', bucket: '31–60', original: 300, payments: 0, balance: 300 },
      { id: '3', account: 'CLM-402', patient: 'Lee, Ann', payer: 'UHC', bucket: '61–90', original: 1200, payments: 400, balance: 800 },
    ],
    summaryCards: [
      sc('a1', '0–30', '$12,400'),
      sc('a2', '31–60', '$8,200'),
      sc('a3', '61–90', '$5,100'),
      sc('a4', '90+', '$3,300'),
      sc('a5', 'Total AR', '$29,000'),
    ],
    numericFooterKeys: ['original', 'payments', 'balance'],
  },

  'claim-adjustment': {
    title: 'Claim Adjustment Report',
    description: 'Adjustments with reason and source for financial and audit review.',
    dateFilterLabel: 'Date range',
    dateFilterHint: 'Adjustment date',
    columns: [
      { key: 'claim', label: 'Claim / Line', ...text },
      { key: 'amount', label: 'Adjustment amount', ...currency },
      { key: 'type', label: 'Type', ...text },
      { key: 'reason', label: 'Reason code', ...text },
      { key: 'desc', label: 'Description', ...text },
      { key: 'by', label: 'Entered by', ...text },
      { key: 'date', label: 'Date', ...text },
    ],
    rows: [
      { id: '1', claim: 'CLM-500 L1', amount: -45, type: 'Contractual', reason: '45', desc: 'Fee schedule', by: 'system', date: '2025-03-01' },
      { id: '2', claim: 'CLM-501 L2', amount: -120, type: 'Write-off', reason: 'WO', desc: 'Charity care policy', by: 'manager1', date: '2025-03-02' },
    ],
    summaryCards: [sc('c1', 'Net adjustments', '-$165.00')],
    breakdown: [
      { label: 'Contractual', count: 42, amount: -18200, pct: 55 },
      { label: 'Write-off', count: 18, amount: -9600, pct: 24 },
      { label: 'Correction', count: 11, amount: 1200, pct: 14 },
      { label: 'Other', count: 9, amount: -800, pct: 7 },
    ],
    numericFooterKeys: ['amount'],
  },

  'audit-compliance': {
    title: 'Audit / Compliance Report',
    description: 'Immutable-style activity log for claim, payment, and account changes (sample data).',
    dateFilterLabel: 'Date range',
    dateFilterHint: 'Event timestamp',
    columns: [
      { key: 'ts', label: 'Timestamp', ...text },
      { key: 'user', label: 'User', ...text },
      { key: 'action', label: 'Action', ...text },
      { key: 'entity', label: 'Entity type', ...text },
      { key: 'entityId', label: 'Entity ID', ...text },
      { key: 'detail', label: 'Before / after summary', ...text },
      { key: 'ip', label: 'IP / device', ...text },
    ],
    rows: [
      { id: '1', ts: '2025-03-12 09:14:22', user: 'jdoe', action: 'UPDATE', entity: 'Claim', entityId: 'CLM-600', detail: 'status: submitted → paid', ip: '10.0.4.12' },
      { id: '2', ts: '2025-03-12 10:02:01', user: 'billing1', action: 'POST', entity: 'Payment', entityId: 'PAY-889', detail: 'applied $400 to CLM-600', ip: '10.0.4.18' },
    ],
    summaryCards: [sc('u1', 'Events in range', '2')],
    rowClickPath: null,
  },

  'top-procedure': {
    title: 'Top Procedure Report',
    description: 'CPT/HCPCS ranked by volume or revenue (sort columns).',
    dateFilterLabel: 'Date range',
    dateFilterHint: 'DOS',
    columns: [
      { key: 'rank', label: 'Rank', ...right, numeric: true, sortable: true },
      { key: 'code', label: 'Code', ...text },
      { key: 'desc', label: 'Description', ...text },
      { key: 'lines', label: 'Claim line count', ...right, numeric: true, sortable: true },
      { key: 'units', label: 'Units', ...right, numeric: true, sortable: true },
      { key: 'charges', label: 'Total charges', ...currency },
      { key: 'paid', label: 'Total paid', ...currency },
    ],
    rows: [
      { id: '1', rank: 1, code: '99213', desc: 'Office visit, est', lines: 210, units: 212, charges: 37800, paid: 32100 },
      { id: '2', rank: 2, code: '99214', desc: 'Office visit, est', lines: 156, units: 158, charges: 40560, paid: 35200 },
      { id: '3', rank: 3, code: '80053', desc: 'Comprehensive metabolic', lines: 98, units: 98, charges: 9310, paid: 7900 },
    ],
    summaryCards: [sc('tp1', 'Procedures in top N', '3')],
    numericFooterKeys: ['lines', 'units', 'charges', 'paid'],
  },

  'insurance-payer-analysis': {
    title: 'Insurance Payer Analysis Report',
    description: 'Payer mix and performance: volume, reimbursement, and simple quality metrics.',
    dateFilterLabel: 'Date range',
    dateFilterHint: 'DOS',
    columns: [
      { key: 'payer', label: 'Payer', ...text },
      { key: 'claims', label: 'Claims', ...right, numeric: true, sortable: true },
      { key: 'billed', label: 'Billed', ...currency },
      { key: 'paid', label: 'Paid', ...currency },
      { key: 'denialRate', label: 'Denial rate', ...text },
      { key: 'dar', label: 'Days in AR (avg)', ...right, numeric: true, sortable: true },
      { key: 'pct', label: 'Reimb. % of billed', ...text },
    ],
    rows: [
      { id: '1', payer: 'BCBS', claims: 420, billed: 182000, paid: 151000, denialRate: '4.2%', dar: 28, pct: '83%' },
      { id: '2', payer: 'Aetna', claims: 310, billed: 128000, paid: 104000, denialRate: '5.1%', dar: 31, pct: '81%' },
      { id: '3', payer: 'UHC', claims: 280, billed: 119000, paid: 93000, denialRate: '6.8%', dar: 35, pct: '78%' },
    ],
    summaryCards: [sc('ip1', 'Payers', '3'), sc('ip2', 'Total paid', '$348,000')],
    numericFooterKeys: ['claims', 'billed', 'paid', 'dar'],
  },

  'claim-trend': {
    title: 'Claim Trend Report',
    description: 'Weekly or monthly trends for submission, payment, denial, and outstanding balances.',
    dateFilterLabel: 'Date range',
    dateFilterHint: 'Activity date (by granularity)',
    trendSeries: [
      { period: '2025-02 W1', submitted: 118, paid: 92, denied: 6, outstanding: 42000 },
      { period: '2025-02 W2', submitted: 124, paid: 101, denied: 9, outstanding: 44500 },
      { period: '2025-02 W3', submitted: 132, paid: 110, denied: 7, outstanding: 46800 },
      { period: '2025-02 W4', submitted: 128, paid: 105, denied: 8, outstanding: 45200 },
    ],
    trendMetrics: ['submitted', 'paid', 'denied'],
    columns: [
      { key: 'period', label: 'Period', ...text },
      { key: 'submitted', label: 'Submitted', ...right, numeric: true, sortable: true },
      { key: 'paid', label: 'Paid', ...right, numeric: true, sortable: true },
      { key: 'denied', label: 'Denied', ...right, numeric: true, sortable: true },
      { key: 'outstanding', label: 'Outstanding balance', ...currency },
    ],
    rows: [
      { id: '1', period: '2025-02 W1', submitted: 118, paid: 92, denied: 6, outstanding: 42000 },
      { id: '2', period: '2025-02 W2', submitted: 124, paid: 101, denied: 9, outstanding: 44500 },
      { id: '3', period: '2025-02 W3', submitted: 132, paid: 110, denied: 7, outstanding: 46800 },
      { id: '4', period: '2025-02 W4', submitted: 128, paid: 105, denied: 8, outstanding: 45200 },
    ],
    summaryCards: [sc('ct1', 'Avg submitted / wk', '125'), sc('ct2', 'Avg paid / wk', '102')],
    numericFooterKeys: ['submitted', 'paid', 'denied', 'outstanding'],
    footNote: 'Chart uses submitted, paid, and denied counts; outstanding is table-only in this preview.',
  },

  'revenue-by-department-facility': {
    title: 'Revenue by Department / Facility',
    description: 'Organizational revenue allocation. Choose revenue recognition basis in production (billed date vs paid date).',
    dateFilterLabel: 'Date range',
    dateFilterHint: 'Billed date (switchable to paid date)',
    columns: [
      { key: 'facility', label: 'Facility', ...text },
      { key: 'dept', label: 'Department', ...text },
      { key: 'gross', label: 'Gross charges', ...currency },
      { key: 'adj', label: 'Adjustments', ...currency },
      { key: 'net', label: 'Net revenue', ...currency },
      { key: 'coll', label: 'Collections', ...currency },
    ],
    rows: [
      { id: '1', facility: 'Main Campus', dept: 'Emergency', gross: 210000, adj: -18000, net: 192000, coll: 165000 },
      { id: '2', facility: 'Main Campus', dept: 'Family Med', gross: 142000, adj: -12000, net: 130000, coll: 112000 },
      { id: '3', facility: 'East Wing', dept: 'Imaging', gross: 98000, adj: -9000, net: 89000, coll: 76000 },
    ],
    summaryCards: [sc('rv1', 'Gross', '$450,000'), sc('rv2', 'Net revenue', '$411,000'), sc('rv3', 'Collections', '$353,000')],
    numericFooterKeys: ['gross', 'adj', 'net', 'coll'],
  },

  'claim-resubmission': {
    title: 'Claim Resubmission Report',
    description: 'Original and corrected claim linkage with version history.',
    dateFilterLabel: 'Date range',
    dateFilterHint: 'Resubmission date (or original DOS)',
    columns: [
      { key: 'original', label: 'Original claim ID', ...text },
      { key: 'resubmit', label: 'Resubmission ID / ver.', ...text },
      { key: 'origDos', label: 'Original DOS', ...text },
      { key: 'resubmitDate', label: 'Resubmit date', ...text },
      { key: 'amtBefore', label: 'Amount before', ...currency },
      { key: 'amtAfter', label: 'Amount after', ...currency },
      { key: 'status', label: 'Status', ...text },
      { key: 'reason', label: 'Reason', ...text },
    ],
    rows: [
      { id: '1', original: 'CLM-700', resubmit: 'CLM-700-R1', origDos: '2025-01-08', resubmitDate: '2025-02-01', amtBefore: 500, amtAfter: 520, status: 'Accepted', reason: 'Corrected modifier' },
    ],
    summaryCards: [sc('r1', 'Resubmissions', '1')],
    numericFooterKeys: ['amtBefore', 'amtAfter'],
  },

  'pending-authorizations': {
    title: 'Pending Authorizations Report',
    description: 'Prior authorizations by status with utilization. Quick filter: expiring within 7 days.',
    dateFilterLabel: 'Date range',
    dateFilterHint: 'Request or effective date',
    columns: [
      { key: 'patient', label: 'Patient', ...text },
      { key: 'service', label: 'Service', ...text },
      { key: 'auth', label: 'Auth #', ...text },
      { key: 'requested', label: 'Request date', ...text },
      { key: 'start', label: 'Effective start', ...text },
      { key: 'end', label: 'Effective end', ...text },
      { key: 'visits', label: 'Used / allowed', ...text },
      { key: 'status', label: 'Status', ...text },
      { key: 'link', label: 'Encounter / Claim', ...text },
    ],
    rows: [
      { id: '1', patient: 'Doe, John', service: 'MRI lumbar', auth: 'AUTH-9921', requested: '2025-02-20', start: '2025-03-01', end: '2025-03-15', visits: '0 / 1', status: 'Approved', link: 'ENC-13001' },
      { id: '2', patient: 'Smith, Mary', service: 'PT bundle', auth: 'AUTH-9922', requested: '2025-03-05', start: '—', end: '—', visits: '—', status: 'Pending', link: '—' },
    ],
    summaryCards: [sc('pa1', 'Pending', '1'), sc('pa2', 'Expiring ≤7 days', '1')],
    breakdown: [
      { label: 'Pending', count: 14, pct: 35 },
      { label: 'Approved', count: 22, pct: 45 },
      { label: 'Denied', count: 4, pct: 10 },
      { label: 'Expired', count: 5, pct: 10 },
    ],
  },

  'duplicate-claims': {
    title: 'Duplicate Claims Report',
    description: 'Suspected duplicates from matching rules (e.g. same patient + DOS + CPT).',
    dateFilterLabel: 'Date range',
    dateFilterHint: 'DOS',
    columns: [
      { key: 'group', label: 'Group ID', ...text },
      { key: 'claims', label: 'Claim IDs', ...text },
      { key: 'patient', label: 'Patient', ...text },
      { key: 'dos', label: 'DOS', ...text },
      { key: 'amounts', label: 'Amounts', ...text },
      { key: 'score', label: 'Match score', ...text },
      { key: 'rule', label: 'Rule name', ...text },
    ],
    rows: [
      { id: '1', group: 'DUP-12', claims: 'CLM-801, CLM-802', patient: 'Doe, John', dos: '2025-02-14', amounts: '$240 / $240', score: '98%', rule: 'Patient+DOS+CPT' },
    ],
    summaryCards: [sc('dc1', 'Suspected groups', '1')],
  },

  'write-off-adjustment-analysis': {
    title: 'Write-Off / Adjustment Analysis',
    description: 'Policy-focused view of write-offs vs raw adjustment lines. Complements the Claim Adjustment Report.',
    dateFilterLabel: 'Date range',
    dateFilterHint: 'Write-off posting date',
    columns: [
      { key: 'category', label: 'Write-off category', ...text },
      { key: 'payer', label: 'Payer', ...text },
      { key: 'lines', label: 'Lines', ...right, numeric: true, sortable: true },
      { key: 'amount', label: 'Amount', ...currency },
      { key: 'pctCharges', label: '% of charges (period)', ...text },
      { key: 'trend', label: 'vs prior period', ...text },
    ],
    rows: [
      { id: '1', category: 'Charity care', payer: 'All', lines: 28, amount: -12400, pctCharges: '2.1%', trend: '-4%' },
      { id: '2', category: 'Small balance', payer: 'All', lines: 112, amount: -5600, pctCharges: '0.9%', trend: '+1%' },
    ],
    summaryCards: [sc('wo1', 'Total write-offs', '-$18,000'), sc('wo2', '% of gross charges', '3.0%')],
    numericFooterKeys: ['lines', 'amount'],
  },

  'patient-balance': {
    title: 'Patient Balance Report',
    description: 'Patient responsibility balances for collections and front-desk follow-up.',
    dateFilterLabel: 'Balance as of',
    dateFilterHint: 'Open balance snapshot',
    showAsOfDate: true,
    columns: [
      { key: 'patient', label: 'Patient', ...text },
      { key: 'account', label: 'Account', ...text },
      { key: 'total', label: 'Total balance', ...currency },
      { key: 'patResp', label: 'Patient responsibility', ...currency },
      { key: 'lastStmt', label: 'Last statement', ...text },
      { key: 'phone', label: 'Contact (role-gated)', ...text },
      { key: 'collections', label: 'In collections', ...text },
    ],
    rows: [
      { id: '1', patient: 'Doe, John', account: 'A-10091', total: 215, patResp: 215, lastStmt: '2025-02-01', phone: '•••-•••-4590', collections: 'No' },
      { id: '2', patient: 'Brown, Chris', account: 'A-10402', total: 1280, patResp: 950, lastStmt: '2025-01-15', phone: '•••-•••-2211', collections: 'Yes' },
    ],
    summaryCards: [sc('pb1', 'Total patient AR', '$1,495.00')],
    numericFooterKeys: ['total', 'patResp'],
    footNote: 'Contact details shown masked—full export requires appropriate role.',
  },

  'provider-compliance': {
    title: 'Provider Compliance Report',
    description: 'Rule violations for billing and credentialing readiness (rule ID + narrative).',
    dateFilterLabel: 'Date range',
    dateFilterHint: 'Encounter or claim date',
    columns: [
      { key: 'provider', label: 'Provider', ...text },
      { key: 'ruleId', label: 'Rule ID', ...text },
      { key: 'rule', label: 'Description', ...text },
      { key: 'claim', label: 'Claim / Encounter', ...text },
      { key: 'severity', label: 'Severity', ...text },
      { key: 'resolution', label: 'Resolution status', ...text },
    ],
    rows: [
      { id: '1', provider: 'Dr. Smith', ruleId: 'BR-01', rule: 'Rendering NPI missing on claim', claim: 'CLM-900', severity: 'High', resolution: 'Open' },
      { id: '2', provider: 'Dr. Ruiz', ruleId: 'BR-14', rule: 'Note signed >72h after DOS', claim: 'ENC-14022', severity: 'Medium', resolution: 'Waived' },
    ],
    summaryCards: [sc('pc1', 'Open issues', '1')],
  },

  'rejected-claims-summary': {
    title: 'Rejected Claims Summary',
    description:
      'Clearinghouse / scrubber rejections before payer acceptance — distinct from paid/denied adjudication.',
    dateFilterLabel: 'Date range',
    dateFilterHint: 'Rejection timestamp',
    helpRule: 'Rejected = not accepted for adjudication; Denied = payer processed and denied.',
    columns: [
      { key: 'claimId', label: 'Claim ID', ...text },
      { key: 'code', label: 'Rejection code', ...text },
      { key: 'message', label: 'Message', ...text },
      { key: 'fix', label: 'Fix instructions', ...text },
      { key: 'source', label: 'Source', ...text },
      { key: 'payer', label: 'Payer', ...text },
      { key: 'resubmitted', label: 'Resubmitted', ...text },
      { key: 'date', label: 'Date', ...text },
    ],
    rows: [
      { id: '1', claimId: 'CLM-910', code: 'CH-77', message: 'Invalid subscriber ID format', fix: 'Verify member ID from card image', source: 'Clearinghouse', payer: 'BCBS', resubmitted: 'N', date: '2025-03-09' },
    ],
    summaryCards: [sc('rj1', 'Rejected (period)', '1')],
    breakdown: [{ label: 'CH-77 Invalid ID', count: 8, pct: 32 }, { label: 'CH-02 Missing DX', count: 6, pct: 24 }, { label: 'Other', count: 11, pct: 44 }],
  },

  'attachment-document': {
    title: 'Attachment / Document Report',
    description: 'Documents attached to claims with required vs optional flags.',
    dateFilterLabel: 'Date range',
    dateFilterHint: 'Upload date',
    columns: [
      { key: 'claimId', label: 'Claim ID', ...text },
      { key: 'type', label: 'Attachment type', ...text },
      { key: 'file', label: 'Filename', ...text },
      { key: 'uploaded', label: 'Upload date', ...text },
      { key: 'dos', label: 'Linked DOS', ...text },
      { key: 'required', label: 'Required?', ...text },
    ],
    rows: [
      { id: '1', claimId: 'CLM-920', type: 'Op note', file: 'op-note-920.pdf', uploaded: '2025-03-08', dos: '2025-03-01', required: 'Yes' },
      { id: '2', claimId: 'CLM-921', type: 'WCM form', file: 'wcm-921.jpg', uploaded: '2025-03-08', dos: '2025-03-02', required: 'No' },
    ],
    summaryCards: [sc('at1', 'Attachments', '2'), sc('at2', 'Claims missing required (sample)', '0')],
  },
};

export function getReportDefinition(slug) {
  return REPORT_DEFINITIONS[slug] || null;
}

export const REPORT_SLUGS = Object.keys(REPORT_DEFINITIONS);
