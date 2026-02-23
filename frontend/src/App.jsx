import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { PatientsPage } from '@/pages/PatientsPage';
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
import { TriageTrackingBoard } from '@/pages/triage-tracking-board/TriageTrackingBoard';
import { PatientDashboard } from '@/pages/patient-dashboard/PatientDashboard';
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
import { ImagingOrdersManagementPage } from '@/pages/imaging-management/imaging-orders-management/ImagingOrdersManagementPage';
import { RadiologyDashboardPage } from '@/pages/radiology-management/RadiologyDashboardPage';
import { OrderManagementPage } from '@/pages/radiology-management/OrderManagementPage';
import { PatientOrderDetailPage } from '@/pages/radiology-management/PatientOrderDetailPage';
import { ImagingStudiesPage } from '@/pages/radiology-management/ImagingStudiesPage';
import { PatientLabelsPreviewPage } from '@/pages/radiology-management/PatientLabelsPreviewPage';
import { PrintableLabelsPage } from '@/pages/radiology-management/PrintableLabelsPage';
import { PrintableReportPage } from '@/pages/radiology-management/PrintableReportPage';
import { OrderFilesPage } from '@/pages/radiology-management/OrderFilesPage';
import { PharmacyDashboardPage } from '@/pages/pharmacy/PharmacyDashboardPage';
import { MedicationPrescriptionsPage } from '@/pages/pharmacy/MedicationPrescriptionsPage';
import { PatientMedicationViewPage } from '@/pages/pharmacy/PatientMedicationViewPage';
import { PharmacyBarcodeLabelsPage } from '@/pages/pharmacy/PharmacyBarcodeLabelsPage';
import { ProviderSchedulesPage } from '@/pages/providers/schedule/ProviderSchedulesPage';
import { OutsideLabOrdersPage } from '@/pages/outpatient/outside-labs/OutsideLabOrdersPage';
import { ExternalLabMasterPage } from '@/pages/outpatient/outside-labs/ExternalLabMasterPage';
import { OutpatientMedicinesPage } from '@/pages/outpatient/medicines/OutpatientMedicinesPage';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="patients" element={<PatientsPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="insurance-providers" element={<InsuranceProvidersPage />} />
          <Route path="nurse-assessment" element={<NurseDashboard />} />
          <Route path="providers" element={<ProvidersPage />} />
          <Route path="providers/schedule" element={<ProviderSchedulesPage />} />
          <Route path="departments" element={<DepartmentsPage />} />
          <Route path="reports" element={<PlaceholderPage title="Reports" />} />
          <Route path="settings" element={<PlaceholderPage title="Settings" />} />
          <Route path="administration/chief-complaint" element={<ChiefComplaint />} />
          <Route path="administration/procedure-codes" element={<ProceduresPage />} />
          <Route path="administration/procedure-categories" element={<ProcedureCategoriesPage />} />
          <Route path="administration/procedures" element={<ProceduresPage />} />
          <Route path="administration/charge-master" element={<ChargeMasterPage />} />
          <Route path="administration/users" element={<UsersPage />} />
          <Route path="administration/roles" element={<RolesPage />} />
          <Route path="administration/permissions" element={<PermissionsPage />} />
          <Route path="administration/permission-headers" element={<PermissionHeadersPage />} />
          <Route path="triage-tracking-board" element={<TriageTrackingBoard />} />
          <Route path="patient-dashboard/:patientId?" element={<PatientDashboard />} />
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
          {/* Imaging Management Routes */}
          <Route path="imaging-management/imaging-orders-management" element={<ImagingOrdersManagementPage />} />

          {/* Pharmacy Routes */}
          <Route path="pharmacy" element={<PharmacyDashboardPage />} />
          <Route path="pharmacy/e-prescribe-med-reconciliation" element={<MedicationPrescriptionsPage />} />
          <Route path="pharmacy/e-prescribe-med-reconciliation/patient/:patientId" element={<PatientMedicationViewPage />} />
          <Route path="pharmacy/barcode-labels" element={<PharmacyBarcodeLabelsPage />} />
          {/* Radiology Management Routes */}
          <Route path="radiology-management" element={<RadiologyDashboardPage />} />
          <Route path="radiology-management/order-management" element={<OrderManagementPage />} />
          <Route path="radiology-management/order-management/patient/:patientId" element={<PatientOrderDetailPage />} />
          <Route path="radiology-management/patient/:patientId/imaging-studies" element={<ImagingStudiesPage />} />
          <Route path="radiology-management/patient/:patientId/labels" element={<PatientLabelsPreviewPage />} />
          <Route path="radiology-management/order/:orderId/labels" element={<PrintableLabelsPage />} />
          <Route path="radiology-management/order/:orderId/report" element={<PrintableReportPage />} />
          <Route path="radiology-management/order/:orderId/files" element={<OrderFilesPage />} />
          {/* Outpatient Routes */}
          <Route path="outpatient/labs" element={<PlaceholderPage title="Outpatient Labs" />} />
          <Route path="outpatient/radiology" element={<PlaceholderPage title="Outpatient Radiology" />} />
          <Route path="outpatient/medicines" element={<OutpatientMedicinesPage />} />
          {/* Outside Laboratories */}
          <Route path="outpatient/outside-labs" element={<OutsideLabOrdersPage />} />
          <Route path="outpatient/outside-labs/external-labs" element={<ExternalLabMasterPage />} />
        </Route>
      </Routes>
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
