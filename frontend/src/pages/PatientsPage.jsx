import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import {
  patientApi,
  providerApi,
  insuranceProviderApi,
} from '@/services/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout/PageHeader';
import { PatientActionMenu } from '@/components/patients/listing/PatientActionMenu';
import { PatientDocumentsModal } from '@/components/patients/listing/PatientDocumentsModal';
import { PatientPaymentModal } from '@/components/patients/listing/PatientPaymentModal';
import { PatientDeleteConfirmDialog } from '@/components/patients/listing/PatientDeleteConfirmDialog';
import { PatientTimelinePanel } from '@/components/patients/listing/PatientTimelinePanel';
import { PatientWristbandModal } from '@/components/patients/listing/PatientWristbandModal';
import { formatPatientInsuranceSummary } from '@/components/patients/listing/patientListUtils';
import {
  PatientListContactCell,
  PatientListPatientCell,
  PatientConsentStatusCell,
  PatientRegistrationStatusCell,
  PatientInsuranceCell,
  getPatientRowAccentClass,
} from '@/components/patients/listing/PatientListCells';
import { PatientResumeAction } from '@/components/patients/listing/PatientResumeAction';
import { useTopbarDepartment } from '@/contexts/TopbarDepartmentContext';
import { cn } from '@/lib/utils';

const PATIENT_LIST_TABS = {
  ALL: 'all',
  REGISTRATION_QUEUE: 'registration_queue',
  MY_LIST: 'my_list',
};

/** Focused worklist views under Patient Management → Registration Queue */
export const PATIENT_WORKLISTS = {
  REGISTRATION_QUEUE: 'registration_queue',
  CONSENT_WORKLIST: 'consent_worklist',
};

const FILTER_DEFAULTS = {
  providerIds: [],
  mrn: '',
  firstName: '',
  lastName: '',
  gender: '',
  dateFrom: '',
  dateTo: '',
  registrationStatus: '',
  consentForm: '',
  insuranceType: '',
  insurancePayerIds: [],
};

function filtersForWorklist(worklist) {
  if (worklist === PATIENT_WORKLISTS.CONSENT_WORKLIST) {
    return { ...FILTER_DEFAULTS, consentForm: 'not_signed' };
  }
  return { ...FILTER_DEFAULTS };
}

function pageMetaForWorklist(worklist) {
  if (worklist === PATIENT_WORKLISTS.REGISTRATION_QUEUE) {
    return {
      title: 'Registration Queue',
      description: 'Patients with pending registration that still need to be completed.',
      breadcrumbs: 'Patient Management / Registration Queue',
    };
  }
  if (worklist === PATIENT_WORKLISTS.CONSENT_WORKLIST) {
    return {
      title: 'Consent Worklist',
      description: 'Patients whose consent status is still pending.',
      breadcrumbs: 'Patient Management / Registration Queue / Consent Worklist',
    };
  }
  return {
    title: 'Patient Management',
    description: 'Search, register, and maintain demographic and contact records for your patient population.',
    breadcrumbs: 'Patient Management',
  };
}

const FIELD_HEIGHT_CLASS = '[&_button]:h-10';

function fullProviderName(provider) {
  return [provider.firstName, provider.middleName, provider.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
}

function getPatientCreatedDate(patient) {
  const raw = patient.createdAt || patient.registrationDate || patient.registeredAt;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(23, 59, 59, 999);
  return d;
}

function listTabParam(listTab) {
  if (listTab === PATIENT_LIST_TABS.REGISTRATION_QUEUE) return 'registration_queue';
  if (listTab === PATIENT_LIST_TABS.MY_LIST) return 'my_list';
  return 'all';
}

export function PatientsPage({ worklist = null } = {}) {
  const navigate = useNavigate();
  const { departmentId } = useTopbarDepartment();
  const isRegistrationQueueWorklist = worklist === PATIENT_WORKLISTS.REGISTRATION_QUEUE;
  const isConsentWorklist = worklist === PATIENT_WORKLISTS.CONSENT_WORKLIST;
  const isFocusedWorklist = isRegistrationQueueWorklist || isConsentWorklist;
  const showResumeAction = isRegistrationQueueWorklist || isConsentWorklist;
  const pageMeta = pageMetaForWorklist(worklist);

  const [patients, setPatients] = useState([]);
  const [providers, setProviders] = useState([]);
  const [insurancePayers, setInsurancePayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listTab, setListTab] = useState(
    isRegistrationQueueWorklist ? PATIENT_LIST_TABS.REGISTRATION_QUEUE : PATIENT_LIST_TABS.ALL,
  );
  const [filters, setFilters] = useState(() => filtersForWorklist(worklist));
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });
  const [actionPatient, setActionPatient] = useState(null);
  const [activeAction, setActiveAction] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [providersRes, payersRes] = await Promise.all([
          providerApi.getAll({ limit: 500, isActive: true }).catch(() => ({ data: [] })),
          insuranceProviderApi.getActive().catch(() => ({ data: [] })),
        ]);
        if (cancelled) return;
        setProviders(Array.isArray(providersRes?.data) ? providersRes.data : []);
        setInsurancePayers(Array.isArray(payersRes?.data) ? payersRes.data : []);
      } catch {
        if (!cancelled) {
          setProviders([]);
          setInsurancePayers([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      const genderMap = { M: 'male', F: 'female', male: 'male', female: 'female' };
      const response = await patientApi.getAll({
        page: pagination.page,
        limit: pagination.limit,
        listTab: listTabParam(listTab),
        mrn: filters.mrn || undefined,
        firstName: filters.firstName || undefined,
        lastName: filters.lastName || undefined,
        gender: filters.gender ? genderMap[filters.gender] || filters.gender : undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        registrationStatus: filters.registrationStatus || undefined,
        consentForm: filters.consentForm || undefined,
        insuranceType: filters.insuranceType || undefined,
        providerIds: filters.providerIds,
        insurancePayerIds: filters.insurancePayerIds,
        departmentId: departmentId || undefined,
      });
      setPatients(response.data || []);
      if (response.pagination) {
        setPagination((prev) => ({ ...prev, ...response.pagination }));
      }
    } catch {
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, listTab, pagination.page, pagination.limit, departmentId]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [departmentId]);

  const providerOptions = useMemo(
    () =>
      providers.map((p) => ({
        value: p.id,
        label: fullProviderName(p) || p.npi || p.id,
      })),
    [providers],
  );

  const providerNameById = useMemo(() => {
    const map = new Map();
    providers.forEach((p) => map.set(p.id, fullProviderName(p).toLowerCase()));
    return map;
  }, [providers]);

  const insurancePayerOptions = useMemo(
    () =>
      insurancePayers.map((ip) => ({
        value: ip.id,
        label: ip.code ? `${ip.name} (${ip.code})` : ip.name,
      })),
    [insurancePayers],
  );

  const setFilter = (key, value) => {
    if (isConsentWorklist && key === 'consentForm') return;
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => setFilters(filtersForWorklist(worklist));

  const hasActiveFilters = useMemo(() => {
    const baseline = filtersForWorklist(worklist);
    return (
      filters.providerIds.length > 0 ||
      filters.mrn.trim() !== '' ||
      filters.firstName.trim() !== '' ||
      filters.lastName.trim() !== '' ||
      filters.gender !== '' ||
      filters.dateFrom !== '' ||
      filters.dateTo !== '' ||
      filters.registrationStatus !== '' ||
      filters.consentForm !== baseline.consentForm ||
      filters.insuranceType !== '' ||
      filters.insurancePayerIds.length > 0
    );
  }, [filters, worklist]);

  const handleAddNewPatient = () => navigate('/patients/new');
  const handleEditPatient = (patient) => {
    navigate(`/patients/edit/${patient.id}`);
  };

  const handlePatientAction = (actionId, patient) => {
    if (actionId === 'dashboard') {
      navigate(`/patient-dashboard/${patient.id}`);
      return;
    }
    if (actionId === 'chart') {
      navigate(`/patients/${patient.id}/chart`);
      return;
    }
    if (actionId === 'edit') {
      handleEditPatient(patient);
      return;
    }
    if (actionId === 'appointment-history') {
      navigate(`/appointments/patient/${patient.id}`);
      return;
    }
    if (actionId === 'encounters') {
      navigate(`/patients/${patient.id}/encounters`);
      return;
    }
    setActionPatient(patient);
    setActiveAction(actionId);
  };

  const closeActionModal = () => {
    setActiveAction(null);
    setActionPatient(null);
  };

  const handlePatientDeleted = () => {
    closeActionModal();
    fetchPatients();
  };

  const serialNumberForRow = (index) => (pagination.page - 1) * pagination.limit + index + 1;

  return (
    <div className="ehr-page">
      <PageHeader
        title={pageMeta.title}
        description={pageMeta.description}
        breadcrumbs={pageMeta.breadcrumbs}
        actions={
          <Button onClick={handleAddNewPatient}>
            <Plus className="h-4 w-4" />
            Add patient
          </Button>
        }
      />

      {!isFocusedWorklist && (
        <section className="content-panel rounded-lg px-4 py-3 sm:px-6">
          <Tabs value={listTab} onValueChange={(value) => { setListTab(value); setPagination((p) => ({ ...p, page: 1 })); }}>
            <TabsList className="grid h-auto w-full max-w-2xl grid-cols-3 bg-muted/50 p-1">
              <TabsTrigger value={PATIENT_LIST_TABS.ALL} className="data-[state=active]:bg-card data-[state=active]:text-foreground">
                All Patients
              </TabsTrigger>
              <TabsTrigger value={PATIENT_LIST_TABS.REGISTRATION_QUEUE} className="data-[state=active]:bg-card data-[state=active]:text-foreground">
                Registration Queue
              </TabsTrigger>
              <TabsTrigger value={PATIENT_LIST_TABS.MY_LIST} className="data-[state=active]:bg-card data-[state=active]:text-foreground">
                My List
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </section>
      )}

      <section className="content-panel space-y-4 rounded-lg p-4 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-foreground">Filters</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
          >
            <X className="h-4 w-4" />
            Clear filters
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="filter-providers">Providers</Label>
            <MultiSelect
              id="filter-providers"
              options={providerOptions}
              value={filters.providerIds}
              onChange={(value) => setFilter('providerIds', value)}
              placeholder="Select providers"
              searchable
              showSelectAll
              searchPlaceholder="Search providers..."
              className={`w-full ${FIELD_HEIGHT_CLASS}`}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-mrn">Patient MRN</Label>
            <Input
              id="filter-mrn"
              value={filters.mrn}
              onChange={(e) => setFilter('mrn', e.target.value)}
              placeholder="Enter MRN"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-first-name">First Name</Label>
            <Input
              id="filter-first-name"
              value={filters.firstName}
              onChange={(e) => setFilter('firstName', e.target.value)}
              placeholder="Enter first name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-last-name">Last Name</Label>
            <Input
              id="filter-last-name"
              value={filters.lastName}
              onChange={(e) => setFilter('lastName', e.target.value)}
              placeholder="Enter last name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-gender">Gender</Label>
            <Select
              value={filters.gender || 'all'}
              onValueChange={(v) => setFilter('gender', v === 'all' ? '' : v)}
            >
              <SelectTrigger id="filter-gender" className="w-full">
                <SelectValue placeholder="All genders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All genders</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-date-from">Registration Date (From)</Label>
            <Input
              id="filter-date-from"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilter('dateFrom', e.target.value)}
              max={filters.dateTo || undefined}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-date-to">Registration Date (To)</Label>
            <Input
              id="filter-date-to"
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilter('dateTo', e.target.value)}
              min={filters.dateFrom || undefined}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-registration-status">Registration Status</Label>
            <Select
              value={filters.registrationStatus || 'all'}
              onValueChange={(v) => setFilter('registrationStatus', v === 'all' ? '' : v)}
            >
              <SelectTrigger id="filter-registration-status" className="w-full">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-consent-form">Consent Form</Label>
            <Select
              value={filters.consentForm || 'all'}
              onValueChange={(v) => setFilter('consentForm', v === 'all' ? '' : v)}
              disabled={isConsentWorklist}
            >
              <SelectTrigger id="filter-consent-form" className="w-full">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="signed">Signed</SelectItem>
                <SelectItem value="not_signed">Not signed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-insurance-type">Insurance Type</Label>
            <Select
              value={filters.insuranceType || 'all'}
              onValueChange={(v) => setFilter('insuranceType', v === 'all' ? '' : v)}
            >
              <SelectTrigger id="filter-insurance-type" className="w-full">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="self_pay">Self pay</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-insurance-payers">Insurance Payers</Label>
            <MultiSelect
              id="filter-insurance-payers"
              options={insurancePayerOptions}
              value={filters.insurancePayerIds}
              onChange={(value) => setFilter('insurancePayerIds', value)}
              placeholder="Select payers"
              searchable
              showSelectAll
              searchPlaceholder="Search payers..."
              className={`w-full ${FIELD_HEIGHT_CLASS}`}
            />
          </div>
        </div>
      </section>

      <div className="content-panel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16 bg-muted/40">Sr No.</TableHead>
              <TableHead className="bg-muted/40">MRN</TableHead>
              <TableHead className="bg-muted/40">Patient</TableHead>
              <TableHead className="bg-muted/40">Contacts</TableHead>
              <TableHead className="bg-muted/40">Registration Status</TableHead>
              <TableHead className="bg-muted/40">Consent Status</TableHead>
              <TableHead className="bg-muted/40">Insurance Information</TableHead>
              <TableHead className="bg-muted/40 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Loading...
                  </div>
                </TableCell>
              </TableRow>
            ) : patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  No patients found
                </TableCell>
              </TableRow>
            ) : (
              patients.map((patient, index) => (
                <TableRow
                  key={patient.id}
                  className={cn('hover:bg-muted/30', getPatientRowAccentClass(patient))}
                >
                  <TableCell className="tabular-nums text-muted-foreground">
                    {serialNumberForRow(index)}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-foreground/90">
                    {patient.mrn ?? '—'}
                  </TableCell>
                  <TableCell>
                    <PatientListPatientCell patient={patient} />
                  </TableCell>
                  <TableCell>
                    <PatientListContactCell patient={patient} />
                  </TableCell>
                  <TableCell>
                    <PatientRegistrationStatusCell patient={patient} />
                  </TableCell>
                  <TableCell>
                    <PatientConsentStatusCell patient={patient} />
                  </TableCell>
                  <TableCell>
                    <PatientInsuranceCell summary={formatPatientInsuranceSummary(patient)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {showResumeAction || listTab === PATIENT_LIST_TABS.REGISTRATION_QUEUE ? (
                        <>
                          <PatientResumeAction
                            tooltip={
                              isConsentWorklist
                                ? 'Complete pending consent forms'
                                : 'Complete the registration process'
                            }
                            onClick={() => handleEditPatient(patient)}
                          />
                          <PatientActionMenu patient={patient} onAction={handlePatientAction} />
                        </>
                      ) : (
                        <PatientActionMenu patient={patient} onAction={handlePatientAction} />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PatientDocumentsModal
        open={activeAction === 'documents'}
        onOpenChange={(open) => !open && closeActionModal()}
        patient={actionPatient}
      />
      <PatientPaymentModal
        open={activeAction === 'payment'}
        onOpenChange={(open) => !open && closeActionModal()}
        patient={actionPatient}
      />
      <PatientDeleteConfirmDialog
        open={activeAction === 'delete'}
        onOpenChange={(open) => !open && closeActionModal()}
        patient={actionPatient}
        onDeleted={handlePatientDeleted}
      />
      <PatientTimelinePanel
        open={activeAction === 'timeline'}
        onOpenChange={(open) => !open && closeActionModal()}
        patient={actionPatient}
      />
      <PatientWristbandModal
        open={activeAction === 'wristband'}
        onOpenChange={(open) => !open && closeActionModal()}
        patient={actionPatient}
      />
    </div>
  );
}
