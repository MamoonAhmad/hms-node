import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { PatientsPage } from '@/pages/PatientsPage';
import { PatientFormPage } from '@/pages/PatientFormPage';
import { PatientChartPage } from '@/pages/patients/PatientChartPage';
import { PatientWorklistsPage } from '@/pages/patients/PatientWorklistsPage';
import { AppointmentsPage } from '@/pages/AppointmentsPage';
import { InsuranceProvidersPage } from '@/pages/InsuranceProvidersPage';
import { ProvidersPage } from '@/pages/providers/ProvidersPage';
import { DepartmentsPage } from '@/pages/departments/DepartmentsPage';
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
import { HcpcsCodesPage } from '@/pages/administration/hcpcs-codes/HcpcsCodesPage';
import { DiagnosisCodesPage } from '@/pages/administration/diagnosis-codes/DiagnosisCodesPage';
import { PlaceOfServicePage } from '@/pages/administration/place-of-service/PlaceOfServicePage';
import { EncountersWorkListPage } from '@/pages/encounters-work-list/EncountersWorkListPage';
import { ProviderSchedulesPage } from '@/pages/providers/schedule/ProviderSchedulesPage';
import { SpecialitiesPage } from '@/pages/providers/specialities/SpecialitiesPage';
import { SubSpecialitiesPage } from '@/pages/providers/sub-specialities/SubSpecialitiesPage';
import { LocationsPage } from '@/pages/providers/locations/LocationsPage';
import { BlockHoursPage } from '@/pages/appointments/block-hours/BlockHoursPage';
import { AppointmentStatusPage } from '@/pages/appointments/appointment-status/AppointmentStatusPage';
import { WaitlistPage } from '@/pages/appointments/waitlist/WaitlistPage';
import { AppointmentPolicyPage } from '@/pages/appointments/AppointmentPolicyPage';
import { AppointmentReportsPage } from '@/pages/appointments/AppointmentReportsPage';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ClaimsListingPage } from '@/pages/rcm/ClaimsListingPage';
import { ClaimTrackerPage } from '@/pages/rcm/ClaimTrackerPage';
import { FollowUpManagementPage } from '@/pages/rcm/FollowUpManagementPage';
import { CMS1500Page } from '@/pages/rcm/CMS1500Page';
import { RcmWorklistPage } from '@/pages/rcm/RcmWorklistPage';
import { ClaimPrintPage } from '@/pages/rcm/ClaimPrintPage';
import { ClaimUB04Page } from '@/pages/rcm/ClaimUB04Page';
import { RcmEncounterPage } from '@/pages/rcm/encounters/RcmEncounterPage';
import { RcmReportPage } from '@/pages/rcm/reports/RcmReportPage';
import { ReportingDashboardPage } from '@/pages/rcm/reports/ReportingDashboardPage';
import { UserProfilePage } from '@/pages/UserProfilePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { PageHeader } from '@/components/layout/PageHeader';

function PlaceholderPage({ title }) {
  return (
    <div className="ehr-page">
      <PageHeader title={title} description="This section is available for configuration." />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/rcm/claims/:claimId/print"
              element={<ProtectedRoute><ClaimPrintPage /></ProtectedRoute>}
            />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<DashboardPage />} />
              <Route path="profile" element={<UserProfilePage />} />
              <Route path="patients" element={<PatientsPage />} />
              <Route path="patients/worklists" element={<PatientWorklistsPage />} />
              <Route path="patients/new" element={<PatientFormPage />} />
              <Route path="patients/edit/:id" element={<PatientFormPage />} />
              <Route path="patients/:id" element={<PatientChartPage />} />
              <Route path="appointments" element={<AppointmentsPage />} />
              <Route path="appointments/waitlist" element={<WaitlistPage />} />
              <Route path="appointments/policy" element={<AppointmentPolicyPage />} />
              <Route path="appointments/reports" element={<AppointmentReportsPage />} />
              <Route path="appointments/block-hours" element={<BlockHoursPage />} />
              <Route path="appointments/appointment-status" element={<AppointmentStatusPage />} />
              <Route path="insurance-providers" element={<InsuranceProvidersPage />} />
              <Route path="providers" element={<ProvidersPage />} />
              <Route path="providers/schedule" element={<ProviderSchedulesPage />} />
              <Route path="providers/specialities" element={<SpecialitiesPage />} />
              <Route path="providers/sub-specialities" element={<SubSpecialitiesPage />} />
              <Route path="providers/locations" element={<LocationsPage />} />
              <Route path="departments" element={<DepartmentsPage />} />
              <Route path="settings" element={<PlaceholderPage title="Settings" />} />
              <Route path="administration/procedure-codes" element={<ProceduresPage />} />
              <Route path="administration/hcpcs-codes" element={<HcpcsCodesPage />} />
              <Route path="administration/diagnosis-codes" element={<DiagnosisCodesPage />} />
              <Route path="administration/place-of-service" element={<PlaceOfServicePage />} />
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
              <Route path="encounters-work-list" element={<EncountersWorkListPage />} />
              <Route path="rcm/encounters/:encounterId" element={<RcmEncounterPage />} />
              <Route path="rcm/worklist" element={<RcmWorklistPage />} />
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

export default App;
