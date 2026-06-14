import { authenticatedRequest, authenticatedRequestBlob, buildQuery, request } from '../../common/services/request';

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

export const loginUser = (email, password) => withErrorLogging('Login', () => (
  request('/employee/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
));

export const logoutUser = () => withErrorLogging('Logout', () => (
  authenticatedRequest('/employee/auth/logout', {
    method: 'POST',
  })
));

export const sendPasswordResetOtp = (email) => withErrorLogging('Send OTP', () => (
  request('/employee/auth/forget-password/send-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
));

export const verifyPasswordResetOtp = (email, otp) => withErrorLogging('Verify OTP', () => (
  request('/employee/auth/forget-password/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  })
));

export const resetPassword = (resetToken, newPassword, confirmPassword) => withErrorLogging('Reset password', () => (
  request('/employee/auth/forget-password/reset-password', {
    method: 'POST',
    body: JSON.stringify({ resetToken, newPassword, confirmPassword }),
  })
));

export const getEmployees = (page = 1, role = '', search = '', status = '') => withErrorLogging('Get employees', () => (
  authenticatedRequest(`/employee/admin/getEmployees${buildQuery({
    page,
    role,
    search,
    status,
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

export const getBids = (page = 1, status = '', search = '', tab = '', clientIds = '', pipeline = '', limit = '', isPinned = undefined) => withErrorLogging('Get bids', () => (
  authenticatedRequest(`/employee/admin/getBids${buildQuery({ page, status, search, tab, client_ids: clientIds, pipeline, limit, is_pinned: isPinned })}`)
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

export const getPersonnelTeams = (bidId) => withErrorLogging('Get personnel teams', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/personnel-teams`)
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

export const getBidGalleries = (bidId) => withErrorLogging('Get bid galleries', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/gallery`)
));

export const createBidGallery = (bidId, payload) => withErrorLogging('Create bid gallery', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/gallery`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
));

export const updateBidGallery = (bidId, galleryId, payload) => withErrorLogging('Update bid gallery', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/gallery/${galleryId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
));

export const deleteBidGallery = (bidId, galleryId) => withErrorLogging('Delete bid gallery', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/gallery/${galleryId}`, {
    method: 'DELETE',
  })
));

export const uploadBidGalleryPhoto = (bidId, galleryId, file) => withErrorLogging('Upload bid gallery photo', () => {
  if (!file) {
    throw new Error('File is required');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      authenticatedRequest(`/employee/admin/bids/${bidId}/gallery/${galleryId}/photos`, {
        method: 'POST',
        headers: {
          'Content-Type': file?.type || 'application/octet-stream',
          'x-file-name': file?.name || 'photo.jpg',
        },
        body: reader.result
      }).then(resolve).catch(reject);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
});

export const updateBidGalleryPhoto = (bidId, galleryId, photoId, payload) => withErrorLogging('Update bid gallery photo', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/gallery/${galleryId}/photos/${photoId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
));

export const deleteBidGalleryPhoto = (bidId, galleryId, photoId) => withErrorLogging('Delete bid gallery photo', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/gallery/${galleryId}/photos/${photoId}`, {
    method: 'DELETE',
  })
));

export const addBidGalleryTag = (bidId, galleryId, tag) => withErrorLogging('Add bid gallery tag', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/gallery/${galleryId}/tags`, {
    method: 'POST',
    body: JSON.stringify({ tag }),
  })
));

export const deleteBidGalleryTag = (bidId, galleryId, tag) => withErrorLogging('Delete bid gallery tag', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/gallery/${galleryId}/tags/${encodeURIComponent(tag)}`, {
    method: 'DELETE',
  })
));


// ── RFI APIs ──
export const getBidRFIs = (bidId, page = 1, limit = 5, search = '', status = 'all') => withErrorLogging('Get bid RFIs', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/rfis${buildQuery({ page, limit, search, status })}`)
));

export const getBidRFI = (bidId, rfiId) => withErrorLogging('Get bid RFI', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/rfis/${rfiId}`)
));

export const createBidRFI = (bidId, payload) => withErrorLogging('Create bid RFI', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/rfis`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
));

export const updateBidRFI = (bidId, rfiId, payload) => withErrorLogging('Update bid RFI', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/rfis/${rfiId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
));

export const deleteBidRFI = (bidId, rfiId) => withErrorLogging('Delete bid RFI', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/rfis/${rfiId}`, {
    method: 'DELETE',
  })
));

export const addBidRFIHistory = (bidId, rfiId, file, message = '', isReplyOnly = false) => withErrorLogging('Add RFI history', () => {
  if (file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        authenticatedRequest(`/employee/admin/bids/${bidId}/rfis/${rfiId}/history`, {
          method: 'POST',
          headers: {
            'Content-Type': file?.type || 'application/octet-stream',
            'x-file-name': file?.name || 'file',
            'x-message': encodeURIComponent(message),
            'x-reply-only': isReplyOnly ? '1' : '0',
          },
          body: reader.result
        }).then(resolve).catch(reject);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }
  return authenticatedRequest(`/employee/admin/bids/${bidId}/rfis/${rfiId}/history`, {
    method: 'POST',
    body: JSON.stringify({ message, is_reply_only: isReplyOnly }),
  });
});

export const deleteBidRFIHistory = (bidId, rfiId, historyId) => withErrorLogging('Delete RFI history', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/rfis/${rfiId}/history/${historyId}`, {
    method: 'DELETE',
  })
));

// ── Submittal APIs ──
export const getBidSubmittals = (bidId, page = 1, limit = 5, search = '', status = 'all') => withErrorLogging('Get bid submittals', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/submittals${buildQuery({ page, limit, search, status })}`)
));

export const getBidSubmittal = (bidId, submittalId) => withErrorLogging('Get bid submittal', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/submittals/${submittalId}`)
));

export const createBidSubmittal = (bidId, payload) => withErrorLogging('Create bid submittal', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/submittals`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
));

export const updateBidSubmittal = (bidId, submittalId, payload) => withErrorLogging('Update bid submittal', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/submittals/${submittalId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
));

export const deleteBidSubmittal = (bidId, submittalId) => withErrorLogging('Delete bid submittal', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/submittals/${submittalId}`, {
    method: 'DELETE',
  })
));

export const addBidSubmittalVersion = (bidId, submittalId, file, message = '', status = 'open') => withErrorLogging('Add submittal version', () => {
  if (file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        authenticatedRequest(`/employee/admin/bids/${bidId}/submittals/${submittalId}/versions`, {
          method: 'POST',
          headers: {
            'Content-Type': file?.type || 'application/octet-stream',
            'x-file-name': file?.name || 'file',
            'x-message': encodeURIComponent(message),
            'x-status': status,
          },
          body: reader.result
        }).then(resolve).catch(reject);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }
  return authenticatedRequest(`/employee/admin/bids/${bidId}/submittals/${submittalId}/versions`, {
    method: 'POST',
    body: JSON.stringify({ message, status }),
  });
});

export const addBidSubmittalReply = (bidId, submittalId, versionId, message) => withErrorLogging('Add submittal reply', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/submittals/${submittalId}/versions/${versionId}/replies`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
));

export const updateBidSubmittalVersion = (bidId, submittalId, versionId, payload) => withErrorLogging('Update submittal version', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/submittals/${submittalId}/versions/${versionId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
));

export const deleteBidSubmittalVersion = (bidId, submittalId, versionId) => withErrorLogging('Delete submittal version', () => (
  authenticatedRequest(`/employee/admin/bids/${bidId}/submittals/${submittalId}/versions/${versionId}`, {
    method: 'DELETE',
  })
));