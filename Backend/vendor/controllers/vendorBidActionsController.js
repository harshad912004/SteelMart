const db = require('../../config/db');
const logger = require('../../common/utils/logger');
const { sendSuccess, sendError } = require('../../common/utils/apiResponse');

// Vendor opts out of bidding on a project
const notBidding = async (req, res) => {
  try {
    const vendorUser = req.user;
    const vendorCompanyId = Number(vendorUser?.client_id);
    const projectId = Number(req.params.projectId);

    if (!Number.isInteger(vendorCompanyId) || vendorCompanyId <= 0) {
      return sendError(res, 401, 'Unauthorized vendor');
    }
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return sendError(res, 400, 'Invalid project ID');
    }

    // Check if vendor is invited to this project
    const [rows] = await db.query(
      'SELECT id, status FROM project_vendors WHERE project_id = ? AND vendor_company_id = ?',
      [projectId, vendorCompanyId]
    );

    if (!rows || rows.length === 0) {
      return sendError(res, 403, 'You are not invited to this project');
    }

    const vendorEntry = rows[0];
    if (vendorEntry.status !== 'invited') {
      const msgMap = {
        approved: 'Cannot opt out of an approved project.',
        proposal_sent: 'Cannot opt out after a proposal has been sent.',
        not_bidding: 'You have already opted out of this project.',
        rejected: 'This bid was already rejected.',
      };
      const msg = msgMap[vendorEntry.status] || `Cannot opt out when status is '${vendorEntry.status}'.`;
      return sendError(res, 400, msg);
    }

    await db.query(
      'UPDATE project_vendors SET status = ?, updated_at = NOW() WHERE id = ?',
      ['not_bidding', vendorEntry.id]
    );

    return sendSuccess(res, 'Successfully opted out of bidding');
  } catch (error) {
    logger.error('Error in vendor notBidding', { error: error.message });
    return sendError(res, 500, 'Error opting out of bidding');
  }
};

module.exports = { notBidding };
