import { authenticatedRequest, buildQuery, request } from '../../common/services/request';

const withErrorLogging = async (label, callback) => {
  try {
    return await callback();
  } catch (error) {
    console.error(`${label} error:`, error);
    throw error;
  }
};

export const loginVendor = (email, password) => withErrorLogging('Vendor login', () => (
  request('/vendor/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
));

export const logoutVendor = () => withErrorLogging('Vendor logout', () => (
  authenticatedRequest('/vendor/auth/logout', {
    method: 'POST',
  })
));

export const getVendorDashboard = () => withErrorLogging('Vendor dashboard', () => (
  authenticatedRequest('/vendor/dashboard')
));

export const getVendorProject = (projectId) => withErrorLogging('Vendor project', () => (
  authenticatedRequest(`/vendor/dashboard/project/${projectId}`)
));

export const sendVendorPasswordResetOtp = (email) => withErrorLogging('Send vendor OTP', () => (
  request('/vendor/auth/forget-password/send-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
));

export const verifyVendorPasswordResetOtp = (email, otp) => withErrorLogging('Verify vendor OTP', () => (
  request('/vendor/auth/forget-password/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  })
));

export const resetVendorPassword = (resetToken, newPassword, confirmPassword) => withErrorLogging('Reset vendor password', () => (
  request('/vendor/auth/forget-password/reset-password', {
    method: 'POST',
    body: JSON.stringify({ resetToken, newPassword, confirmPassword }),
  })
));

export const getVendorBidRFIs = (bidId, page = 1, limit = 5, search = '', status = 'all') => withErrorLogging('Vendor get RFIs', () => (
  authenticatedRequest(`/vendor/dashboard/project/${bidId}/rfis${buildQuery({ page, limit, search, status })}`)
));

export const getVendorBidRFI = (bidId, rfiId) => withErrorLogging('Vendor get RFI', () => (
  authenticatedRequest(`/vendor/dashboard/project/${bidId}/rfis/${rfiId}`)
));

export const createVendorBidRFI = (bidId, data) => withErrorLogging('Vendor create RFI', () => (
  authenticatedRequest(`/vendor/dashboard/project/${bidId}/rfis`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
));

export const updateVendorBidRFI = (bidId, rfiId, data) => withErrorLogging('Vendor update RFI', () => (
  authenticatedRequest(`/vendor/dashboard/project/${bidId}/rfis/${rfiId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
));

export const deleteVendorBidRFI = (bidId, rfiId) => withErrorLogging('Vendor delete RFI', () => (
  authenticatedRequest(`/vendor/dashboard/project/${bidId}/rfis/${rfiId}`, {
    method: 'DELETE',
  })
));

export const addVendorBidRFIHistory = (bidId, rfiId, file, message, status) => withErrorLogging('Vendor add RFI history', () => {
  const formData = new FormData();
  formData.append('message', message);
  if (status) formData.append('status', status);
  if (file) formData.append('file', file);
  return authenticatedRequest(`/vendor/dashboard/project/${bidId}/rfis/${rfiId}/history`, {
    method: 'POST',
    body: formData,
    isFormData: true
  });
});

export const getVendorBidSubmittals = (bidId, page = 1, limit = 5, search = '', status = 'all') => withErrorLogging('Vendor get submittals', () => (
  authenticatedRequest(`/vendor/dashboard/project/${bidId}/submittals${buildQuery({ page, limit, search, status })}`)
));

export const getVendorBidSubmittal = (bidId, submittalId) => withErrorLogging('Vendor get submittal', () => (
  authenticatedRequest(`/vendor/dashboard/project/${bidId}/submittals/${submittalId}`)
));

export const createVendorBidSubmittal = (bidId, data) => withErrorLogging('Vendor create submittal', () => (
  authenticatedRequest(`/vendor/dashboard/project/${bidId}/submittals`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
));

export const updateVendorBidSubmittal = (bidId, submittalId, data) => withErrorLogging('Vendor update submittal', () => (
  authenticatedRequest(`/vendor/dashboard/project/${bidId}/submittals/${submittalId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
));

export const deleteVendorBidSubmittal = (bidId, submittalId) => withErrorLogging('Vendor delete submittal', () => (
  authenticatedRequest(`/vendor/dashboard/project/${bidId}/submittals/${submittalId}`, {
    method: 'DELETE',
  })
));

export const addVendorBidSubmittalVersion = (bidId, submittalId, file, message, status) => withErrorLogging('Vendor add submittal version', () => {
  const formData = new FormData();
  formData.append('message', message);
  if (status) formData.append('status', status);
  if (file) formData.append('file', file);
  return authenticatedRequest(`/vendor/dashboard/project/${bidId}/submittals/${submittalId}/versions`, {
    method: 'POST',
    body: formData,
    isFormData: true
  });
});

export const addVendorBidSubmittalReply = (bidId, submittalId, versionId, message) => withErrorLogging('Vendor add submittal reply', () => (
  authenticatedRequest(`/vendor/dashboard/project/${bidId}/submittals/${submittalId}/versions/${versionId}/replies`, {
    method: 'POST',
    body: JSON.stringify({ message })
  })
));

export const submitVendorProposal = (projectId, price, leadTime = null, files = null) => withErrorLogging('Submit vendor proposal', () => {
  const formData = new FormData();
  formData.append('price', price);
  if (leadTime) formData.append('lead_time', leadTime);
  if (files && files.length > 0) {
    files.forEach((file) => formData.append('files', file));
  }
  return authenticatedRequest(`/vendor/dashboard/project/${projectId}/proposal`, {
    method: 'POST',
    body: formData,
    isFormData: true,
  });
});

export const vendorNotBidding = (projectId) => withErrorLogging('Vendor not bidding', () => (
  authenticatedRequest(`/vendor/dashboard/project/${projectId}/not-bidding`, {
    method: 'POST',
  })
));

export const getVendorProjectMaterials = (projectId) => withErrorLogging('Vendor project materials', () => (
  authenticatedRequest(`/vendor/dashboard/project/${projectId}/materials`)
));
