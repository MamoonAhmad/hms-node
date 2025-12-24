import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { PatientsPage } from '@/pages/PatientsPage';
import { AppointmentsPage } from '@/pages/AppointmentsPage';
import { InsuranceProvidersPage } from '@/pages/InsuranceProvidersPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="patients" element={<PatientsPage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="insurance-providers" element={<InsuranceProvidersPage />} />
            <Route path="reports" element={<PlaceholderPage title="Reports" />} />
            <Route path="settings" element={<PlaceholderPage title="Settings" />} />
          </Route>
        </Routes>
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
