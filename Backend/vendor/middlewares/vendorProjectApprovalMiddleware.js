const db = require('../../config/db');
const logger = require('../../common/utils/logger');
const { sendError } = require('../../common/utils/apiResponse');

/**
 * Middleware that verifies a vendor is approved for the given project.
 * Must be used AFTER isVendorAuthenticated (which sets req.user).
 * Reads :id from req.params (the project ID from the parent route).
 *
 * On success, sets req.vendorProject = { id, status } and calls next().
 * On failure, sends an appropriate 401/403 error response.
 */
const requireApprovedVendor = async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return sendError(res, 400, 'Valid project ID is required.');
    }

    const vendorCompanyId = Number(req.user?.client_id);
    if (!Number.isInteger(vendorCompanyId) || vendorCompanyId <= 0) {
      return sendError(res, 401, 'Unauthorized vendor');
    }

    const [rows] = await db.query(
      'SELECT id, status FROM project_vendors WHERE project_id = ? AND vendor_company_id = ? LIMIT 1',
      [projectId, vendorCompanyId]
    );

    if (!rows || rows.length === 0) {
      return sendError(res, 403, 'Access denied: you are not associated with this project.');
    }

    const vendorProject = rows[0];

    if (vendorProject.status !== 'approved') {
      return sendError(
        res,
        403,
        'Access denied: your proposal must be approved by the admin to access this feature.'
      );
    }

    req.vendorProject = vendorProject;
    next();
  } catch (err) {
    logger.error('Vendor project approval check failed', {
      requestId: req.requestId,
      error: err.message,
    });
    return sendError(res, 500, 'Server error verifying project access.');
  }
};

module.exports = { requireApprovedVendor };
