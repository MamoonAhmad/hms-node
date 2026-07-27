import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { PatientsPage, PATIENT_WORKLISTS } from '@/pages/PatientsPage';
import { PatientEncountersPage } from '@/pages/patients/PatientEncountersPage';
import { PatientFormPage } from '@/pages/PatientFormPage';
import { WaitlistPage } from '@/pages/patient-management/WaitlistPage';
import { AppointmentsPage } from '@/pages/AppointmentsPage';
import { AppointmentFormPage } from '@/pages/appointments/AppointmentFormPage';
import { PatientAppointmentHistoryPage } from '@/pages/appointments/PatientAppointmentHistoryPage';
import { InsuranceProvidersPage } from '@/pages/InsuranceProvidersPage';
import { ProvidersPage } from '@/pages/providers/ProvidersPage';
import { DepartmentsPage } from '@/pages/departments/DepartmentsPage';
import ChiefComplaint from '@/components/Administration/ChiefComplaint';
import { ProcedureCategoriesPage } from '@/pages/administration/procedure-categories/ProcedureCategoriesPage';
import { ProceduresPage } from '@/pages/administration/procedures/ProceduresPage';
import { ChargeMasterPage } from '@/pages/administration/charge-master/ChargeMasterPage';
import { UsersPage } from '@/pages/administration/users/UsersPage';
import { RolesPage } from '@/pages/administration/roles/RolesPage';
import { PermissionsPage } from '@/pages/administration/permissions/PermissionsPage';
import { PermissionHeadersPage } from '@/pages/administration/permission-headers/PermissionHeadersPage';
import { BillingProvidersPage } from '@/pages/administration/billing-providers/BillingProvidersPage';
import { FacilitiesPage } from '@/pages/administration/facility/FacilitiesPage';
import { AppointmentTypesPage } from '@/pages/administration/appointment-types/AppointmentTypesPage';
import { ConsentFormsPage } from '@/pages/administration/consent-forms/ConsentFormsPage';
import { HcpcsCodesPage } from '@/pages/administration/hcpcs-codes/HcpcsCodesPage';
import { DiagnosisCodesPage } from '@/pages/administration/diagnosis-codes/DiagnosisCodesPage';
import { TriageTrackingBoard } from '@/pages/triage-tracking-board/TriageTrackingBoard';
import { PatientDashboard } from '@/pages/patient-dashboard/PatientDashboard';
import { PatientChartPage } from '@/pages/patient-chart/PatientChartPage';
import { EmarPage } from '@/pages/patient-dashboard/EmarPage';
import { CustomOrderSetPage } from '@/pages/custom-order-set/CustomOrderSetPage';
import { ManageInventoryPage } from '@/pages/medication-management/manage-inventory/ManageInventoryPage';
import { MedicationOrdersPage } from '@/pages/medication-management/medication-orders/MedicationOrdersPage';
import { LaboratoryMasterPage } from '@/pages/laboratory-management/laboratory-master/LaboratoryMasterPage';
import { SpecimenCollectionPage } from '@/pages/laboratory-management/specimen-collection/SpecimenCollectionPage';
import { PatientSpecimenDetailPage } from '@/pages/laboratory-management/specimen-collection/PatientSpecimenDetailPage';
import { LabBarcodeLabelsPage } from '@/pages/laboratory-management/specimen-collection/LabBarcodeLabelsPage';
import { SpecimenTransportPage } from '@/pages/laboratory-management/specimen-transport/SpecimenTransportPage';
import { PatientTransportDetailPage } from '@/pages/laboratory-management/specimen-transport/PatientTransportDetailPage';
import { SpecimenReceiverPage } from '@/pages/laboratory-management/specimen-receiver/SpecimenReceiverPage';
import { PatientReceiverDetailPage } from '@/pages/laboratory-management/specimen-receiver/PatientReceiverDetailPage';
import { ResultManagementPage } from '@/pages/laboratory-management/result-management/ResultManagementPage';
import { PatientResultDetailPage } from '@/pages/laboratory-management/result-management/PatientResultDetailPage';
import { EditResultPage } from '@/pages/laboratory-management/result-management/EditResultPage';
import { LabReportPrintPage } from '@/pages/laboratory-management/result-management/LabReportPrintPage';
import { TestCatalogPage } from '@/pages/laboratory-management/test-catalog/TestCatalogPage';
import { LabOrderTransportPage } from '@/pages/laboratory-management/lab-order-transport/LabOrderTransportPage';
import { LabReportReceivedPage } from '@/pages/laboratory-management/lab-report-received/LabReportReceivedPage';
import { OutsideLabsPage } from '@/pages/laboratory-management/outside-labs/OutsideLabsPage';
import { PatientOutsideLabsDetailPage } from '@/pages/laboratory-management/outside-labs/PatientOutsideLabsDetailPage';
import { ImagingOrdersManagementPage } from '@/pages/imaging-management/imaging-orders-management/ImagingOrdersManagementPage';
import { OrderManagementPage } from '@/pages/radiology-management/OrderManagementPage';
import { PatientOrderDetailPage } from '@/pages/radiology-management/PatientOrderDetailPage';
import { OutsideRadiologyOrdersPage } from '@/pages/radiology-management/outside-radiology-orders/OutsideRadiologyOrdersPage';
import { PatientOutsideRadiologyDetailPage } from '@/pages/radiology-management/outside-radiology-orders/PatientOutsideRadiologyDetailPage';
import { ImagingStudiesPage } from '@/pages/radiology-management/ImagingStudiesPage';
import { PatientLabelsPreviewPage } from '@/pages/radiology-management/PatientLabelsPreviewPage';
import { PrintableLabelsPage } from '@/pages/radiology-management/PrintableLabelsPage';
import { PrintableReportPage } from '@/pages/radiology-management/PrintableReportPage';
import { OrderFilesPage } from '@/pages/radiology-management/OrderFilesPage';
import { RadiologyMasterPage } from '@/pages/radiology-management/RadiologyMasterPage';
import { MedicationPrescriptionsPage } from '@/pages/pharmacy/MedicationPrescriptionsPage';
import { PatientMedicationViewPage } from '@/pages/pharmacy/PatientMedicationViewPage';
import { PharmacyBarcodeLabelsPage } from '@/pages/pharmacy/PharmacyBarcodeLabelsPage';
import { VaccineMasterPage } from '@/pages/pharmacy/vaccine-master/VaccineMasterPage';
import { MedicinesMasterPage } from '@/pages/pharmacy/medicines-master/MedicinesMasterPage';
import { MedicationFormularyPage } from '@/pages/pharmacy/medication-formulary/MedicationFormularyPage';
import { PharmacyInventoryPage } from '@/pages/pharmacy/PharmacyInventoryPage';
import { ProviderSchedulesPage } from '@/pages/providers/schedule/ProviderSchedulesPage';
import { SpecialitiesPage } from '@/pages/providers/specialities/SpecialitiesPage';
import { SubSpecialitiesPage } from '@/pages/providers/sub-specialities/SubSpecialitiesPage';
import { LocationsPage } from '@/pages/providers/locations/LocationsPage';
import { BlockHoursPage } from '@/pages/appointments/block-hours/BlockHoursPage';
import { AppointmentStatusPage } from '@/pages/appointments/appointment-status/AppointmentStatusPage';
import { OutsideLabOrdersPage } from '@/pages/outpatient/outside-labs/OutsideLabOrdersPage';
import { ExternalLabMasterPage } from '@/pages/outpatient/outside-labs/ExternalLabMasterPage';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ClaimsListingPage } from '@/pages/rcm/ClaimsListingPage';
import { ClaimsWorklistPage } from '@/pages/rcm/ClaimsWorklistPage';
import { ClaimTrackerPage } from '@/pages/rcm/ClaimTrackerPage';
import { FollowUpManagementPage } from '@/pages/rcm/FollowUpManagementPage';
import { CMS1500Page } from '@/pages/rcm/CMS1500Page';
import { ClaimUB04Page } from '@/pages/rcm/ClaimUB04Page';
import { RcmReportPage } from '@/pages/rcm/reports/RcmReportPage';
import { ReportingDashboardPage } from '@/pages/rcm/reports/ReportingDashboardPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RoomsPage } from '@/pages/patient-management/rooms/RoomsPage';
import { BedsPage } from '@/pages/patient-management/beds/BedsPage';
import { RoomTypesPage } from '@/pages/patient-management/room-types/RoomTypesPage';
import { EncountersPage } from '@/pages/patient-management/encounters/EncountersPage';
import { OutpatientTrackingBoard } from '@/pages/outpatient-tracking-board/OutpatientTrackingBoard';

function PharmacyPage() {
  const [searchParams] = useSearchParams();
  const report = searchParams.get('report');
  if (report === 'inventory') return <PharmacyInventoryPage />;
  return <PlaceholderPage title="Pharmacy" />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="patients" element={<PatientsPage />} />
          <Route path="patients/new" element={<PatientFormPage />} />
          <Route path="patients/edit/:id" element={<PatientFormPage />} />
          <Route path="patients/:patientId/encounters" element={<PatientEncountersPage />} />
          <Route path="patients/:patientId/chart" element={<PatientChartPage />} />
          <Route
            path="patient-management/registration-queue"
            element={<PatientsPage worklist={PATIENT_WORKLISTS.REGISTRATION_QUEUE} />}
          />
          <Route path="patient-management/waitlist" element={<WaitlistPage />} />
          <Route
            path="patient-management/consent-worklist"
            element={<PatientsPage worklist={PATIENT_WORKLISTS.CONSENT_WORKLIST} />}
          />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="appointments/new" element={<AppointmentFormPage />} />
          <Route path="appointments/:appointmentId/edit" element={<AppointmentFormPage />} />
          <Route path="appointments/patient/:patientId" element={<PatientAppointmentHistoryPage />} />
          <Route path="appointments/block-hours" element={<BlockHoursPage />} />
          <Route path="appointments/appointment-status" element={<AppointmentStatusPage />} />
          <Route path="insurance-providers" element={<InsuranceProvidersPage />} />
          <Route path="providers" element={<ProvidersPage />} />
          <Route path="providers/schedule" element={<ProviderSchedulesPage />} />
          <Route path="providers/specialities" element={<SpecialitiesPage />} />
          <Route path="providers/sub-specialities" element={<SubSpecialitiesPage />} />
          <Route path="providers/locations" element={<LocationsPage />} />
          <Route path="departments" element={<DepartmentsPage />} />
          <Route path="reports" element={<PlaceholderPage title="Reports" />} />
          <Route path="settings" element={<PlaceholderPage title="Settings" />} />
          <Route path="administration/chief-complaint" element={<ChiefComplaint />} />
          <Route path="administration/consent-forms" element={<ConsentFormsPage />} />
          <Route path="administration/procedure-codes" element={<ProceduresPage />} />
          <Route path="administration/hcpcs-codes" element={<HcpcsCodesPage />} />
          <Route path="administration/diagnosis-codes" element={<DiagnosisCodesPage />} />
          <Route path="administration/procedure-categories" element={<ProcedureCategoriesPage />} />
          <Route path="administration/procedures" element={<ProceduresPage />} />
          <Route path="administration/charge-master" element={<ChargeMasterPage />} />
          <Route path="administration/billing-providers" element={<BillingProvidersPage />} />
          <Route path="administration/appointment-types" element={<AppointmentTypesPage />} />
          <Route path="administration/facility" element={<FacilitiesPage />} />
          <Route path="administration/users" element={<UsersPage />} />
          <Route path="administration/roles" element={<RolesPage />} />
          <Route path="administration/permissions" element={<PermissionsPage />} />
          <Route path="administration/permission-headers" element={<PermissionHeadersPage />} />
          <Route path="triage-tracking-board" element={<TriageTrackingBoard />} />
          <Route path="nurse-tracking-board" element={<EncountersPage />} />
          <Route path="outpatient_tracking_board" element={<OutpatientTrackingBoard />} />
          <Route path="patient-dashboard/:patientId?" element={<PatientDashboard />} />
          <Route path="custom-order-set" element={<CustomOrderSetPage />} />
          <Route path="patient-management/encounters" element={<EncountersPage />} />
          <Route path="patient-management/rooms" element={<RoomsPage />} />
          <Route path="patient-management/beds" element={<BedsPage />} />
          <Route path="patient-management/room-types" element={<RoomTypesPage />} />
          <Route path="orders" element={<PlaceholderPage title="Orders & Order Sets" />} />
          <Route path="clinical-notes" element={<PlaceholderPage title="Clinical Notes" />} />
          <Route path="ai-dictation" element={<PlaceholderPage title="AI Dictation" />} />
          <Route path="billing" element={<PlaceholderPage title="Billing & Encounter" />} />
          <Route path="emar/:patientId" element={<EmarPage />} />
          <Route path="emar" element={<PlaceholderPage title="eMAR" />} />
          <Route path="results" element={<PlaceholderPage title="Results" />} />
          {/* Medication Management Routes */}
          <Route path="medication-management/manage-inventory" element={<ManageInventoryPage />} />
          <Route path="medication-management/medication-orders" element={<MedicationOrdersPage />} />
          {/* Laboratory Management Routes */}
          <Route path="laboratory-management/laboratory-master" element={<LaboratoryMasterPage />} />
          <Route path="laboratory-management/specimen-collection" element={<SpecimenCollectionPage />} />
          <Route path="laboratory-management/specimen-collection/patient/:patientId" element={<PatientSpecimenDetailPage />} />
          <Route path="laboratory-management/specimen-collection/labels" element={<LabBarcodeLabelsPage />} />
          <Route path="laboratory-management/specimen-transport" element={<SpecimenTransportPage />} />
          <Route path="laboratory-management/specimen-transport/patient/:patientId" element={<PatientTransportDetailPage />} />
          <Route path="laboratory-management/specimen-receiver" element={<SpecimenReceiverPage />} />
          <Route path="laboratory-management/specimen-receiver/patient/:patientId" element={<PatientReceiverDetailPage />} />
          <Route path="laboratory-management/lab-order-transport" element={<LabOrderTransportPage />} />
          <Route path="laboratory-management/lab-report-received" element={<LabReportReceivedPage />} />
          <Route path="laboratory-management/result-management" element={<ResultManagementPage />} />
          <Route path="laboratory-management/result-management/patient/:patientId" element={<PatientResultDetailPage />} />
          <Route path="laboratory-management/result-management/patient/:patientId/edit/:labTestId" element={<EditResultPage />} />
          <Route path="laboratory-management/result-management/report/:labTestId" element={<LabReportPrintPage />} />
          <Route path="laboratory-management/test-catalog" element={<TestCatalogPage />} />
          <Route path="laboratory-management/outside-labs" element={<OutsideLabsPage />} />
          <Route path="laboratory-management/outside-labs/patient/:patientId" element={<PatientOutsideLabsDetailPage />} />
          {/* Imaging Management Routes */}
          <Route path="imaging-management/imaging-orders-management" element={<ImagingOrdersManagementPage />} />

          {/* Pharmacy Routes */}
          <Route path="pharmacy" element={<PharmacyPage />} />
          <Route path="pharmacy/e-prescribe-med-reconciliation" element={<MedicationPrescriptionsPage />} />
          <Route path="pharmacy/e-prescribe-med-reconciliation/patient/:patientId" element={<PatientMedicationViewPage />} />
          <Route path="pharmacy/barcode-labels" element={<PharmacyBarcodeLabelsPage />} />
          <Route path="pharmacy/medicines-master" element={<MedicinesMasterPage />} />
          <Route path="pharmacy/medication-formulary" element={<MedicationFormularyPage />} />
          <Route path="pharmacy/vaccine-master" element={<VaccineMasterPage />} />
          {/* Radiology Management Routes */}
          <Route path="radiology-management/master" element={<RadiologyMasterPage />} />
          <Route path="radiology-management/order-management" element={<OrderManagementPage />} />
          <Route path="radiology-management/order-management/patient/:patientId" element={<PatientOrderDetailPage />} />
          <Route path="radiology-management/outside-radiology-orders" element={<OutsideRadiologyOrdersPage />} />
          <Route path="radiology-management/outside-radiology-orders/patient/:patientId" element={<PatientOutsideRadiologyDetailPage />} />
          <Route path="radiology-management/patient/:patientId/imaging-studies" element={<ImagingStudiesPage />} />
          <Route path="radiology-management/patient/:patientId/labels" element={<PatientLabelsPreviewPage />} />
          <Route path="radiology-management/order/:orderId/labels" element={<PrintableLabelsPage />} />
          <Route path="radiology-management/order/:orderId/report" element={<PrintableReportPage />} />
          <Route path="radiology-management/order/:orderId/files" element={<OrderFilesPage />} />
          {/* Outpatient Routes */}
          <Route path="outpatient/labs" element={<PlaceholderPage title="Outpatient Labs" />} />
          <Route path="outpatient/radiology" element={<PlaceholderPage title="Outpatient Radiology" />} />
          {/* Outside Laboratories */}
          <Route path="outpatient/outside-labs" element={<OutsideLabOrdersPage />} />
          <Route path="outpatient/outside-labs/external-labs" element={<ExternalLabMasterPage />} />
          {/* RCM */}
          <Route path="rcm/claims" element={<ClaimsListingPage />} />
          <Route path="rcm/claims-worklist" element={<ClaimsWorklistPage />} />
          <Route path="rcm/claim-tracker" element={<ClaimTrackerPage />} />
          <Route path="rcm/follow-up-management" element={<FollowUpManagementPage />} />
          <Route path="rcm/cms-1500" element={<CMS1500Page />} />
          <Route path="rcm/claim-ub04" element={<ClaimUB04Page />} />
          <Route path="rcm/reports/dashboard" element={<ReportingDashboardPage />} />
          <Route path="rcm/reports/:reportSlug" element={<RcmReportPage />} />
          <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}

function PlaceholderPage({ title }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      <p className="text-muted-foreground">This page is under construction.</p>
    </div>
  );
}

export default App;
