import { authenticatedRequest, authenticatedRequestBlob, buildQuery, request } from './request';

const CONTACT_TYPE_QUERY_MAP = {
  'General Contractors': 'General Contractor',
  Vendors: 'Vendor'
};

const withErrorLogging = async (label, callback) => {
  try {
    return await callback();
  } catch (error) {
    console.error(`${label} error:`, error);
    throw error;
  }
};

const resolveContactType = (type) => (
  type && type !== 'All' ? (CONTACT_TYPE_QUERY_MAP[type] || type) : ''
);

// ==========================================
// 1. DEDUPLICATED AUTHENTICATION ENDPOINTS
// ==========================================

const createAuthEndpoints = (prefix) => ({
  login: (email, password) => withErrorLogging(`${prefix} Login`, () => (
    request(`/${prefix.toLowerCase()}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  )),
  logout: () => withErrorLogging(`${prefix} Logout`, () => (
    authenticatedRequest(`/${prefix.toLowerCase()}/auth/logout`, {
      method: 'POST',
    })
  )),
  sendOtp: (email) => withErrorLogging(`${prefix} Send OTP`, () => (
    request(`/${prefix.toLowerCase()}/auth/forget-password/send-otp`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  )),
  verifyOtp: (email, otp) => withErrorLogging(`${prefix} Verify OTP`, () => (
    request(`/${prefix.toLowerCase()}/auth/forget-password/verify-otp`, {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    })
  )),
  resetPassword: (resetToken, newPassword, confirmPassword) => withErrorLogging(`${prefix} Reset password`, () => (
    request(`/${prefix.toLowerCase()}/auth/forget-password/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ resetToken, newPassword, confirmPassword }),
    })
  )),
});

const employeeAuth = createAuthEndpoints('Employee');
const vendorAuth = createAuthEndpoints('Vendor');

// Employee Auth Exports
export const loginUser = employeeAuth.login;
export const logoutUser = employeeAuth.logout;
export const sendPasswordResetOtp = employeeAuth.sendOtp;
export const verifyPasswordResetOtp = employeeAuth.verifyOtp;
export const resetPassword = employeeAuth.resetPassword;

// Vendor Auth Exports
export const loginVendor = vendorAuth.login;
export const logoutVendor = vendorAuth.logout;
export const sendVendorPasswordResetOtp = vendorAuth.sendOtp;
export const verifyVendorPasswordResetOtp = vendorAuth.verifyOtp;
export const resetVendorPassword = vendorAuth.resetPassword;

// ==========================================
// 2. EMPLOYEE ADMIN ENDPOINTS
// ==========================================

export const getEmployees = (page = 1, role = '', search = '', status = '', limit = '', companyType = '') => withErrorLogging('Get employees', () => (
  authenticatedRequest(`/employee/admin/getEmployees${buildQuery({
    page,
    role,
    search,
    status,
    limit,
    company_type: companyType,
  })}`)
));

export const getEmployee = (employeeId) => withErrorLogging('Get employee', () => (
  authenticatedRequest(`/employee/admin/viewEmployee/${employeeId}`)
));

export const getAdminProfile = (employeeId) => withErrorLogging('Get admin profile', () => (
  authenticatedRequest(`/employee/admin/viewEmployee/${employeeId}`)
));

export const addEmployee = (employeeData) => withErrorLogging('Add employee', () => (
  authenticatedRequest('/employee/admin/addEmployee', {
    method: 'POST',
    body: JSON.stringify(employeeData),
  })
));

export const updateEmployee = (employeeId, employeeData) => withErrorLogging('Update employee', () => (
  authenticatedRequest(`/employee/admin/updateEmployee/${employeeId}`, {
    method: 'PUT',
    body: JSON.stringify(employeeData),
  })
));

export const updateAdminProfile = (employeeId, employeeData) => withErrorLogging('Update admin profile', () => (
  authenticatedRequest(`/employee/admin/updateEmployee/${employeeId}`, {
    method: 'PUT',
    body: JSON.stringify(employeeData),
  })
));

export const activeEmployee = (employeeId) => withErrorLogging('Active employee', () => (
  authenticatedRequest(`/employee/admin/activeEmployee/${employeeId}`, {
    method: 'POST',
  })
));

export const inactiveEmployee = (employeeId) => withErrorLogging('Inactive employee', () => (
  authenticatedRequest(`/employee/admin/inactiveEmployee/${employeeId}`, {
    method: 'POST',
  })
));

export const unblockEmployee = (employeeId) => withErrorLogging('Unblock employee', () => (
  authenticatedRequest(`/employee/admin/unblockEmployee/${employeeId}`, {
    method: 'POST',
  })
));

export const blockEmployee = (employeeId) => withErrorLogging('Block employee', () => (
  authenticatedRequest(`/employee/admin/blockEmployee/${employeeId}`, {
    method: 'POST',
  })
));

export const deleteEmployee = (employeeId) => withErrorLogging('Delete employee', () => (
  authenticatedRequest(`/employee/admin/deleteEmployee/${employeeId}`, {
    method: 'DELETE',
  })
));

// ==========================================
// 3. CLIENTS & CONTACTS ENDPOINTS
// ==========================================

// ── RFI APIs ──
export const getProjectsWithRFIs = () => withErrorLogging('Get projects with RFIs', () => (
  authenticatedRequest('/employee/admin/rfis-projects')
));

export const getProjectsWithSubmittals = () => withErrorLogging('Get projects with Submittals', () => (
  authenticatedRequest('/employee/admin/submittals-projects')
));

export const getAllClients = (page = 1, limit = 10, search = '', type = '') => withErrorLogging('Get clients', () => (
  authenticatedRequest(`/employee/client/all${buildQuery({
    page,
    limit,
    search,
    type: resolveContactType(type),
  })}`)
));

export const getContacts = (page = 1, clientType = '', limit = 10) => withErrorLogging('Get contacts', () => (
  authenticatedRequest(`/employee/client/all${buildQuery({
    page,
    limit,
    type: resolveContactType(clientType),
  })}`)
));

export const getClient = (clientId) => withErrorLogging('Get client', () => {
  if (!clientId) {
    throw new Error('Client ID is required');
  }

  return authenticatedRequest(`/employee/client/${clientId}`);
});

export const getClientTypesById = (typeId) => withErrorLogging('Get client types by id', () => (
  authenticatedRequest(`/employee/client/type/${typeId}`)
));

export const getClientTypes = () => withErrorLogging('Get client types', () => (
  authenticatedRequest('/employee/client/types')
));

export const getEmployeeTags = () => withErrorLogging('Get employee tags', () => (
  authenticatedRequest('/employee/client/tags')
));

export const createClient = (clientData) => withErrorLogging('Create client', () => (
  authenticatedRequest('/employee/client/create', {
    method: 'POST',
    body: JSON.stringify(clientData),
  })
));

export const updateClient = (clientId, clientData) => withErrorLogging('Update client', () => (
  authenticatedRequest(`/employee/client/${clientId}`, {
    method: 'PUT',
    body: JSON.stringify(clientData),
  })
));

export const deleteClient = (clientId) => withErrorLogging('Delete client', () => (
  authenticatedRequest(`/employee/client/${clientId}`, {
    method: 'DELETE',
  })
));

export const blockClient = (clientId) => withErrorLogging('Block client', () => (
  authenticatedRequest(`/employee/client/${clientId}/block`, {
    method: 'POST',
  })
));

export const searchClients = (query) => withErrorLogging('Search clients', () => (
  authenticatedRequest(`/employee/client/search${buildQuery({ query })}`)
));

export const getClientEmployees = (clientId, page = 1, limit = 10, search = '') => withErrorLogging('Get client employees', () => (
  authenticatedRequest(`/employee/client/${clientId}/employees/all${buildQuery({
    page,
    limit,
    search,
  })}`)
));

export const getClientEmployeeAdmins = (clientId) => withErrorLogging('Get client employee admins', () => (
  authenticatedRequest(`/employee/client/${clientId}/employees/admins`)
));

export const getClientsByType = (typeId, page = 1, limit = 10) => withErrorLogging('Get clients by type', () => (
  authenticatedRequest(`/employee/client/type/${typeId}${buildQuery({ page, limit })}`)
));

export const addClientEmployee = (clientId, clientEmployeeData) => withErrorLogging('Add client employee', () => (
  authenticatedRequest(`/employee/client/${clientId}/employees/create`, {
    method: 'POST',
    body: JSON.stringify(clientEmployeeData),
  })
));

// ==========================================
// 4. BIDS ENDPOINTS
// ==========================================

export const getBids = (page = 1, status = '', search = '', tab = '', clientIds = '', pipeline = '', limit = '', isPinned = undefined, startDate = '', endDate = '') => withErrorLogging('Get bids', () => (
  authenticatedRequest(`/employee/admin/getBids${buildQuery({ page, status, search, tab, client_ids: clientIds, pipeline, limit, is_pinned: isPinned, start_date: startDate, end_date: endDate })}`)
));

export const getDueSoon = (page = 1, limit = 10) => withErrorLogging('Get due soon', () => (
  authenticatedRequest(`/employee/admin/getDueSoon${buildQuery({ page, limit })}`)
));

export const pinBid = (bidId) => withErrorLogging('Pin bid', () => (
  authenticatedRequest(`/employee/admin/pinBid/${bidId}`, {
    method: 'POST',
  })
));

export const unpinBid = (bidId) => withErrorLogging('Unpin bid', () => (
  authenticatedRequest(`/employee/admin/unpinBid/${bidId}`, {
    method: 'POST',
  })
));

export const getBid = (bidId) => withErrorLogging('Get bid', () => (
  authenticatedRequest(`/employee/admin/viewBid/${bidId}`)
));

export const createBid = (bidData) => withErrorLogging('Create bid', () => (
  authenticatedRequest('/employee/admin/createBid', {
    method: 'POST',
    body: JSON.stringify(bidData),
  })
));

export const updateBid = (bidId, bidData) => withErrorLogging('Update bid', () => (
  authenticatedRequest(`/employee/admin/updateBid/${bidId}`, {
    method: 'PUT',
    body: JSON.stringify(bidData),
  })
));

export const updateBids = (bidId, bidData) => withErrorLogging('Update bids', () => (
  authenticatedRequest(`/employee/admin/updateBid/${bidId}`, {
    method: 'PUT',
    body: JSON.stringify(bidData),
  })
));

export const deleteBid = (bidId) => withErrorLogging('Delete bid', () => (
  authenticatedRequest(`/employee/admin/deleteBid/${bidId}`, {
    method: 'DELETE',
  })
));

export const archiveBid = (bidId) => withErrorLogging('Archive bid', () => (
  authenticatedRequest(`/employee/admin/archiveBid/${bidId}`, {
    method: 'POST',
  })
));

export const unarchiveBid = (bidId) => withErrorLogging('Unarchive bid', () => (
  authenticatedRequest(`/employee/admin/unarchiveBid/${bidId}`, {
    method: 'POST',
  })
));

// ==========================================
// 5. BID FOLDERS & FILES ENDPOINTS
// ==========================================

export const getBidFolders = (bidId, parentId = null) => withErrorLogging('Get bid folders', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/folders${buildQuery({ parent_id: parentId })}`)
));

export const createBidFolder = (bidId, payload) => withErrorLogging('Create bid folder', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/folders`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
));

export const renameBidFolder = (bidId, folderId, folderName) => withErrorLogging('Rename bid folder', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/folders/${folderId}`, {
    method: 'PUT',
    body: JSON.stringify({ folder_name: folderName }),
  })
));

export const deleteBidFolder = (bidId, folderId) => withErrorLogging('Delete bid folder', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/folders/${folderId}`, {
    method: 'DELETE',
  })
));

export const getBidFolderFiles = (bidId, folderId) => withErrorLogging('Get bid folder files', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/folders/${folderId}/files`)
));

export const getBidRootFiles = (bidId) => withErrorLogging('Get bid root files', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/files`)
));

export const uploadBidFolderFile = (bidId, folderId, file, customFileName = '') => withErrorLogging('Upload bid folder file', () => {
  if (!file) {
    throw new Error('File is required');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      authenticatedRequest(`/employee/admin/bids/${bidId}/folders/${folderId}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': file?.type || 'application/octet-stream',
          'x-file-name': customFileName || file?.name || 'file',
        },
        body: reader.result
      }).then(resolve).catch(reject);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
});

export const uploadBidRootFile = (bidId, file, folderPath = '', customFileName = '') => withErrorLogging('Upload bid root file', () => {
  if (!file) {
    throw new Error('File is required');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const headers = {
        'Content-Type': file?.type || 'application/octet-stream',
        'x-file-name': customFileName || file?.name || 'file',
      };

      if (folderPath) {
        headers['x-folder-path'] = folderPath;
      }

      authenticatedRequest(`/employee/admin/bids/${bidId}/files`, {
        method: 'POST',
        headers,
        body: reader.result
      }).then(resolve).catch(reject);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
});

export const deleteBidFolderFile = (bidId, folderId, fileId) => withErrorLogging('Delete bid folder file', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/folders/${folderId}/files/${fileId}`, {
    method: 'DELETE',
  })
));

export const renameBidFolderFile = (bidId, folderId, fileId, fileName) => withErrorLogging('Rename bid folder file', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/folders/${folderId}/files/${fileId}`, {
    method: 'PUT',
    body: JSON.stringify({ file_name: fileName }),
  })
));

export const downloadBidFolderFile = (bidId, folderId, fileId) => withErrorLogging('Download bid folder file', () => (
  authenticatedRequestBlob(`/employee/admin/bids/${bidId}/folders/${folderId}/files/${fileId}/download`)
));

// ==========================================
// 6. ESTIMATION COSTING & REPORTING ENDPOINTS
// ==========================================

export const getBidCostDetails = (bidId) => withErrorLogging('Get bid cost details', () => (
  authenticatedRequest(`/employee/admin/getCostDetails/${bidId}`)
));

export const saveBidCostDetails = (bidId, payload) => withErrorLogging('Save bid cost details', () => (
  authenticatedRequest(`/employee/admin/saveCostDetails/${bidId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
));

export const previewEstimatePdf = (bidId) => withErrorLogging('Preview estimate PDF', () => (
  authenticatedRequestBlob(`/employee/admin/previewEstimate/${bidId}`)
));

export const downloadEstimatePdf = (bidId) => withErrorLogging('Download estimate PDF', () => (
  authenticatedRequestBlob(`/employee/admin/downloadEstimate/${bidId}`)
));

export const sendEstimatePdf = (bidId, emails, companyIds = []) => withErrorLogging('Send estimate PDF', () => (
  authenticatedRequest(`/employee/admin/sendEstimate/${bidId}`, {
    method: 'POST',
    body: JSON.stringify({
      emails: Array.isArray(emails) ? emails : [emails],
      company_ids: Array.isArray(companyIds) ? companyIds : companyIds ? [companyIds] : [],
    }),
  })
));

export const getReportingDashboard = (filter = 'all', hours = '') => withErrorLogging('Get reporting dashboard', () => (
  authenticatedRequest(`/employee/admin/reporting/dashboard${buildQuery({ filter, hours })}`)
));

export const getReportingNoResponseClients = (filter = 'all', limit = 10) => withErrorLogging('Get no response clients', () => (
  authenticatedRequest(`/employee/admin/reporting/no-response-clients${buildQuery({ filter, limit })}`)
));

export const getReportingEmployees = (page = 1, filter = 'all') => withErrorLogging('Get reporting employees', () => (
  authenticatedRequest(`/employee/admin/reporting/employees${buildQuery({ page, filter })}`)
));

export const getReportingEstimateLedger = (page = 1, limit = 10, search = '', filter = 'all') => withErrorLogging('Get estimate ledger', () => (
  authenticatedRequest(`/employee/admin/reporting/estimate-ledger${buildQuery({
    page,
    limit,
    search,
    filter,
  })}`)
));

// ==========================================
// 7. PERSONNEL TEAMS ENDPOINTS
// ==========================================

export const getPersonnelTeams = (bidId) => withErrorLogging('Get personnel teams', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/personnel-teams`)
));

/**
 * Fetches employees grouped by team type (steelmart, gc, vendor) for the Add Team modal.
 * Returns: { steelmart, gcCompanies, gcEmployees, vendorCompanies, vendorEmployees }
 */
export const getPersonnelTeamEmployees = (bidId) => withErrorLogging('Get personnel team employees', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/personnel-teams/employees`)
));

export const createPersonnelTeam = (bidId, teamData) => withErrorLogging('Create personnel team', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/personnel-teams`, {
    method: 'POST',
    body: JSON.stringify(teamData),
  })
));

export const updatePersonnelTeam = (bidId, teamId, teamData) => withErrorLogging('Update personnel team', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/personnel-teams/${teamId}`, {
    method: 'PUT',
    body: JSON.stringify(teamData),
  })
));

export const deletePersonnelTeam = (bidId, teamId) => withErrorLogging('Delete personnel team', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/personnel-teams/${teamId}`, {
    method: 'DELETE',
  })
));

// ==========================================
// 8. FINANCIALS & ADMIN ENDPOINTS
// ==========================================

export const getFinancialsAdminData = (bidId) => withErrorLogging('Get financials data', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/financials`)
));

export const updateProjectExpenses = (bidId, payload) => withErrorLogging('Update project expenses', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/financials/expenses`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
));

export const addChangeOrder = (bidId, payload) => withErrorLogging('Add change order', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/financials/change-orders`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
));

export const updateChangeOrderStatus = (bidId, payload) => withErrorLogging('Update change order status', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/financials/change-orders/status`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
));

export const addProjectPayment = (bidId, payload) => withErrorLogging('Add project payment', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/financials/payments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
));

export const addComplianceDocument = (bidId, payload) => withErrorLogging('Add compliance document', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/financials/compliance`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
));

export const updateComplianceDocumentStatus = (bidId, payload) => withErrorLogging('Update compliance document status', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/financials/compliance/status`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
));

// ==========================================
// 9. VENDOR SPECIFIC ENDPOINTS
// ==========================================

export const getVendorDashboard = () => withErrorLogging('Vendor dashboard', () => (
  authenticatedRequest('/vendor/dashboard')
));

export const getVendorProject = (projectId) => withErrorLogging('Vendor project', () => (
  authenticatedRequest(`/vendor/dashboard/project/${projectId}`)
));

// ==========================================
// 10. VENDOR BID MANAGEMENT ENDPOINTS (Employee Side)
// ==========================================

export const getBidVendors = (bidId) => withErrorLogging('Get bid vendors', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/vendors`)
));

export const getAvailableVendors = (bidId, search = '') => withErrorLogging('Get available vendors', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/vendors/available${buildQuery({ search })}`)
));

export const inviteVendorsToBid = (bidId, vendorCompanyIds, dueDate = null, notes = null) => withErrorLogging('Invite vendors to bid', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/vendors`, {
    method: 'POST',
    body: JSON.stringify({ vendor_company_ids: vendorCompanyIds, due_date: dueDate, notes }),
  })
));

export const addExternalVendor = (bidId, payload) => withErrorLogging('Add external vendor', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/vendors/external`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
));

export const approveVendorProposal = (bidId, vendorEntryId) => withErrorLogging('Approve vendor proposal', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/vendors/${vendorEntryId}/approve`, {
    method: 'POST',
  })
));

export const rejectVendorProposal = (bidId, vendorEntryId, rejectedReason = '') => withErrorLogging('Reject vendor proposal', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/vendors/${vendorEntryId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ rejected_reason: rejectedReason }),
  })
));

export const removeVendorFromBid = (bidId, vendorEntryId) => withErrorLogging('Remove vendor from bid', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/vendors/${vendorEntryId}`, {
    method: 'DELETE',
  })
));

// ==========================================
// 11. VENDOR PROPOSAL SUBMISSION (Vendor Side)
// ==========================================

export const submitVendorProposal = (projectId, price, leadTime = null, notes = null) => withErrorLogging('Submit vendor proposal', () => (
  authenticatedRequest(`/vendor/dashboard/project/${projectId}/proposal`, {
    method: 'POST',
    body: JSON.stringify({ price, lead_time: leadTime, notes }),
  })
));

// ==========================================
// 12. PROJECT COMPLETION (Admin Side)
// ==========================================

export const completeProject = (bidId) => withErrorLogging('Complete project', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/complete`, {
    method: 'POST',
  })
));