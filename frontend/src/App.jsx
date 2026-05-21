import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { PatientsPage } from '@/pages/PatientsPage';
import { PatientFormPage } from '@/pages/PatientFormPage';
import { AppointmentsPage } from '@/pages/AppointmentsPage';
import { InsuranceProvidersPage } from '@/pages/InsuranceProvidersPage';
import { NurseDashboard } from '@/pages/nurses/NurseDashboard';
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
import { NurseTrackingBoardPage } from '@/pages/nurse-tracking-board/NurseTrackingBoardPage';
import { PatientDashboard } from '@/pages/patient-dashboard/PatientDashboard';
import { CustomOrderSetPage } from '@/pages/custom-order-set/CustomOrderSetPage';
import { ManageInventoryPage } from '@/pages/medication-management/manage-inventory/ManageInventoryPage';
import { MedicationOrdersPage } from '@/pages/medication-management/medication-orders/MedicationOrdersPage';
import { LaboratoryDashboardPage } from '@/pages/laboratory-management/LaboratoryDashboardPage';
import { SpecimenCollectionPage } from '@/pages/laboratory-management/specimen-collection/SpecimenCollectionPage';
import { PatientSpecimenDetailPage } from '@/pages/laboratory-management/specimen-collection/PatientSpecimenDetailPage';
import { LabBarcodeLabelsPage } from '@/pages/laboratory-management/specimen-collection/LabBarcodeLabelsPage';
import { SpecimenTransportPage } from '@/pages/laboratory-management/specimen-transport/SpecimenTransportPage';
import { PatientTransportDetailPage } from '@/pages/laboratory-management/specimen-transport/PatientTransportDetailPage';
import { SpecimenReceiverPage } from '@/pages/laboratory-management/specimen-receiver/SpecimenReceiverPage';
import { PatientReceiverDetailPage } from '@/pages/laboratory-management/specimen-receiver/PatientReceiverDetailPage';
import { ResultManagementPage } from '@/pages/laboratory-management/result-management/ResultManagementPage';
import { PatientResultDetailPage } from '@/pages/laboratory-management/result-management/PatientResultDetailPage';
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
import { MedicationPrescriptionsPage } from '@/pages/pharmacy/MedicationPrescriptionsPage';
import { PatientMedicationViewPage } from '@/pages/pharmacy/PatientMedicationViewPage';
import { PharmacyBarcodeLabelsPage } from '@/pages/pharmacy/PharmacyBarcodeLabelsPage';
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
import { ClaimTrackerPage } from '@/pages/rcm/ClaimTrackerPage';
import { FollowUpManagementPage } from '@/pages/rcm/FollowUpManagementPage';
import { CMS1500Page } from '@/pages/rcm/CMS1500Page';
import { ClaimUB04Page } from '@/pages/rcm/ClaimUB04Page';
import { RcmReportPage } from '@/pages/rcm/reports/RcmReportPage';
import { ReportingDashboardPage } from '@/pages/rcm/reports/ReportingDashboardPage';
import { PhysiologicalOrderManagementPage } from '@/pages/physiological-tests/PhysiologicalOrderManagementPage';
import { PatientPhysiologicalOrderDetailPage } from '@/pages/physiological-tests/PatientPhysiologicalOrderDetailPage';
import { OutsidePhysiologicalTestsPage } from '@/pages/physiological-tests/outside/OutsidePhysiologicalTestsPage';
import { PatientOutsidePhysiologicalDetailPage } from '@/pages/physiological-tests/outside/PatientOutsidePhysiologicalDetailPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RoomsPage } from '@/pages/patient-management/rooms/RoomsPage';
import { BedsPage } from '@/pages/patient-management/beds/BedsPage';
import { RoomTypesPage } from '@/pages/patient-management/room-types/RoomTypesPage';

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
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="appointments/block-hours" element={<BlockHoursPage />} />
          <Route path="appointments/appointment-status" element={<AppointmentStatusPage />} />
          <Route path="insurance-providers" element={<InsuranceProvidersPage />} />
          <Route path="nurse-assessment" element={<NurseDashboard />} />
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
          <Route path="nurse-tracking-board" element={<NurseTrackingBoardPage />} />
          <Route path="patient-dashboard/:patientId?" element={<PatientDashboard />} />
          <Route path="custom-order-set" element={<CustomOrderSetPage />} />
          <Route path="patient-management/rooms" element={<RoomsPage />} />
          <Route path="patient-management/beds" element={<BedsPage />} />
          <Route path="patient-management/room-types" element={<RoomTypesPage />} />
          {/* Physiological tests */}
          <Route path="physiological-tests/order-management" element={<PhysiologicalOrderManagementPage />} />
          <Route path="physiological-tests/order-management/patient/:patientId" element={<PatientPhysiologicalOrderDetailPage />} />
          <Route path="physiological-tests/order-management/patient/:patientId/labels" element={<PlaceholderPage title="Physiological test labels" />} />
          <Route path="physiological-tests/outside" element={<OutsidePhysiologicalTestsPage />} />
          <Route path="physiological-tests/outside/patient/:patientId" element={<PatientOutsidePhysiologicalDetailPage />} />
          <Route path="physiological-tests/outside/patient/:patientId/labels" element={<PlaceholderPage title="Outside physiological test labels" />} />
          <Route path="orders" element={<PlaceholderPage title="Orders & Order Sets" />} />
          <Route path="clinical-notes" element={<PlaceholderPage title="Clinical Notes" />} />
          <Route path="ai-dictation" element={<PlaceholderPage title="AI Dictation" />} />
          <Route path="billing" element={<PlaceholderPage title="Billing & Encounter" />} />
          <Route path="emar" element={<PlaceholderPage title="eMAR" />} />
          <Route path="results" element={<PlaceholderPage title="Results" />} />
          {/* Medication Management Routes */}
          <Route path="medication-management/manage-inventory" element={<ManageInventoryPage />} />
          <Route path="medication-management/medication-orders" element={<MedicationOrdersPage />} />
          {/* Laboratory Management Routes */}
          <Route path="laboratory-management" element={<LaboratoryDashboardPage />} />
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
          {/* Radiology Management Routes */}
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
