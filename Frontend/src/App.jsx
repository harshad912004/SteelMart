import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import DashboardLayout from './employees/components/DashboardLayout';
import ErrorBoundary from './employees/components/ErrorBoundary';
import ProtectedRoute from './common/components/ProtectedRoute/ProtectedRoute';
import { getAuthenticatedHome } from './common/auth/session';
import { employeeAdminRoutes } from './employees/routes';
import { EMPLOYEE_DASHBOARD_PATH, EMPLOYEE_LOGIN_PATH, EMPLOYEE_RESET_PASSWORD_PATH } from './employees/routes';
import { VENDOR_DASHBOARD_PATH, VENDOR_LOGIN_PATH, VENDOR_PROJECT_DETAIL_PATH, VENDOR_RESET_PASSWORD_PATH, VENDOR_COI_PATH } from './vendors/routes';

const LoginPage = lazy(() => import('./employees/pages/Login'));
const ResetPasswordPage = lazy(() => import('./employees/pages/ResetPassword'));
const VendorLoginPage = lazy(() => import('./vendors/pages/Login'));
const VendorResetPasswordPage = lazy(() => import('./vendors/pages/ResetPassword'));
const VendorDashboardPage = lazy(() => import('./vendors/pages/Dashboard'));
const VendorProjectDetailPage = lazy(() => import('./vendors/pages/ProjectDetail'));
const VendorCOIPage = lazy(() => import('./vendors/pages/COI/VendorCOIPage'));
const DashboardPage = lazy(() => import('./employees/pages/Dashboard'));
const EmployeesPage = lazy(() => import('./employees/pages/Employees'));
const EmployeeDetailPage = lazy(() => import('./employees/pages/EmployeeDetail'));
const EmployeeDashboardPage = lazy(() => import('./employees/pages/EmployeeDashboard'));
const SalesPage = lazy(() => import('./employees/pages/Sales'));
const CRMPage = lazy(() => import('./employees/pages/CRM'));
const ContactsPage = lazy(() => import('./employees/pages/Contacts'));
const ContactDetailPage = lazy(() => import('./employees/pages/ContactDetail'));
const PlaceholderPage = lazy(() => import('./employees/pages/Placeholder'));
const ProjectsPage = lazy(() => import('./employees/pages/Projects/ProjectsPage'));
const ReportsPage = lazy(() => import('./employees/pages/Reports/ReportsPage'));
const RFIsPage = lazy(() => import('./employees/pages/RFIs'));
const RFIDetailPage = lazy(() => import('./employees/pages/RFIDetail'));
const SubmittalsPage = lazy(() => import('./employees/pages/Submittals/SubmittalsPage'));
const SubmittalDetailPage = lazy(() => import('./employees/pages/SubmittalDetail'));
const GalleryPage = lazy(() => import('./employees/pages/Gallery/GalleryPage'));
const CalendarPage = lazy(() => import('./employees/pages/Calendar'));
const FinancialsAdminPage = lazy(() => import('./employees/pages/FinancialsAdmin'));

const adminRouteElements = {
  DashboardPage: <DashboardPage />,
  EmployeesPage: <EmployeesPage />,
  EmployeeDetailPage: <EmployeeDetailPage />,
  SalesPage: <SalesPage />,
  CRMPage: <CRMPage />,
  ContactsPage: <ContactsPage />,
  ContactDetailPage: <ContactDetailPage />,
  ProjectsPage: <ProjectsPage />,
  RFIsPage: <RFIsPage />,
  RFIDetailPage: <RFIDetailPage />,
  SubmittalsPage: <SubmittalsPage />,
  SubmittalDetailPage: <SubmittalDetailPage />,
  ReportsPage: <ReportsPage />,
  GalleryPage: <GalleryPage />,
  CalendarPage: <CalendarPage />,
  FinancialsAdminPage: <FinancialsAdminPage />,
};

function FullPageLoader() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 100%)',
        color: '#334155',
      }}
    >
      <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>Loading workspace...</div>
    </div>
  );
}

function LoginRedirect({ children }) {
  const authenticatedHome = getAuthenticatedHome();

  if (authenticatedHome) {
    return <Navigate to={authenticatedHome} replace />;
  }

  return children;
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<FullPageLoader />}>
          <Routes>
            <Route
              path="/"
              element={(
                <LoginRedirect>
                  <Navigate to={EMPLOYEE_LOGIN_PATH} replace />
                </LoginRedirect>
              )}
            />
            <Route
              path="/login"
              element={<Navigate to={EMPLOYEE_LOGIN_PATH} replace />}
            />
            <Route
              path="/employee"
              element={<Navigate to={EMPLOYEE_LOGIN_PATH} replace />}
            />
            <Route
              path={EMPLOYEE_LOGIN_PATH}
              element={(
                <LoginRedirect>
                  <LoginPage />
                </LoginRedirect>
              )}
            />
            <Route
              path="/vendor"
              element={<Navigate to={VENDOR_LOGIN_PATH} replace />}
            />
            <Route
              path={VENDOR_LOGIN_PATH}
              element={(
                <LoginRedirect>
                  <VendorLoginPage />
                </LoginRedirect>
              )}
            />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
              path="/vender/login"
              element={<Navigate to={VENDOR_LOGIN_PATH} replace />}
            />
            <Route path={VENDOR_RESET_PASSWORD_PATH} element={<VendorResetPasswordPage />} />
            <Route
              path="/vender/reset-password"
              element={<Navigate to={VENDOR_RESET_PASSWORD_PATH} replace />}
            />
            <Route path={EMPLOYEE_RESET_PASSWORD_PATH} element={<ResetPasswordPage />} />

            <Route element={<ProtectedRoute accountType="vendor" loginPath={VENDOR_LOGIN_PATH} />}>
              <Route path={VENDOR_DASHBOARD_PATH} element={<VendorDashboardPage />} />
              <Route path={VENDOR_PROJECT_DETAIL_PATH} element={<VendorProjectDetailPage />} />
              <Route path={VENDOR_COI_PATH} element={<VendorCOIPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route
                path="/employee-dashboard"
                element={(
                  <DashboardLayout>
                    <EmployeeDashboardPage />
                  </DashboardLayout>
                )}
              />
            </Route>

            <Route element={<ProtectedRoute />}>
              {employeeAdminRoutes.map((route) => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={<DashboardLayout>{adminRouteElements[route.page]}</DashboardLayout>}
                />
              ))}
              <Route
                path="*"
                element={(
                  <DashboardLayout>
                    <PlaceholderPage />
                  </DashboardLayout>
                )}
              />
            </Route>

            <Route path="*" element={<Navigate to={EMPLOYEE_LOGIN_PATH} replace />} />
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;