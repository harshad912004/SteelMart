export const EMPLOYEE_LOGIN_PATH = '/employee/login';
export const EMPLOYEE_RESET_PASSWORD_PATH = '/employee/reset-password';
export const EMPLOYEE_DASHBOARD_PATH = '/dashboard';

export const employeeAdminRoutes = [
  { path: '/dashboard', page: 'DashboardPage' },
  { path: '/dashboard/employee', page: 'EmployeesPage' },
  { path: '/dashboard/employee/:id', page: 'EmployeeDetailPage' },
  { path: '/dashboard/sales', page: 'SalesPage' },
  { path: '/dashboard/crm', page: 'CRMPage' },
  { path: '/dashboard/contacts', page: 'ContactsPage' },
  { path: '/dashboard/contacts/:id', page: 'ContactDetailPage' },
  { path: '/dashboard/projects', page: 'ProjectsPage' },
  { path: '/dashboard/projects/:id/rfis', page: 'RFIsPage' },
  { path: '/dashboard/projects/:id/rfis/:rfiId', page: 'RFIDetailPage' },
  { path: '/dashboard/projects/:id/submittals', page: 'SubmittalsPage' },
  { path: '/dashboard/projects/:id/submittals/:submittalId', page: 'SubmittalDetailPage' },
  { path: '/dashboard/projects/:id/gallery', page: 'GalleryPage' },
  { path: '/dashboard/projects/:id/financials', page: 'FinancialsAdminPage' },
  { path: '/dashboard/reports', page: 'ReportsPage' },
  { path: '/dashboard/calendar', page: 'CalendarPage' },
];