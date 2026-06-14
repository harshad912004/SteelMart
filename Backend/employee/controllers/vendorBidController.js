const db = require('../../config/db');
const logger = require('../../common/utils/logger');
const { sendSuccess, sendError } = require('../../common/utils/apiResponse');
const bcryptjs = require('bcryptjs');

/**
 * Recalculates vendor_cost and material_cost from source tables
 * and persists them into project_financials for the given project.
 * Called automatically after approve / reject actions.
 */
const syncProjectFinancials = async (projectId) => {
  try {
    // 1. Vendor cost = sum of approved vendor proposal prices
    const [vendorRows] = await db.query(
      `SELECT COALESCE(SUM(proposal_price), 0) AS total_vendor
       FROM project_vendors
       WHERE project_id = ? AND status = 'approved' AND proposal_price IS NOT NULL`,
      [projectId]
    );
    const vendorCost = Number(vendorRows[0]?.total_vendor) || 0;

    // 2. Material cost = sum of invoice grand totals
    const [invoiceRows] = await db.query(
      `SELECT COALESCE(SUM(grand_total), 0) AS total_material
       FROM project_invoices
       WHERE project_id = ?`,
      [projectId]
    );
    const materialCost = Number(invoiceRows[0]?.total_material) || 0;

    // 3. Upsert project_financials
    const [existing] = await db.query(
      'SELECT id FROM project_financials WHERE project_id = ?',
      [projectId]
    );

    if (existing && existing.length > 0) {
      await db.query(
        `UPDATE project_financials
         SET vendor_cost = ?, material_cost = ?
         WHERE project_id = ?`,
        [vendorCost, materialCost, projectId]
      );
    } else {
      // Fetch overhead/profit defaults from the project
      const [projRows] = await db.query(
        'SELECT overhead, profit FROM projects WHERE id = ?',
        [projectId]
      );
      const proj = projRows[0];
      await db.query(
        `INSERT INTO project_financials (project_id, vendor_cost, material_cost, overhead_cost_percent, estimated_profit)
         VALUES (?, ?, ?, ?, ?)`,
        [projectId, vendorCost, materialCost, proj?.overhead || 0, proj?.profit || 0]
      );
    }

    logger.info(`Synced financials for project ${projectId}: vendor_cost=${vendorCost}, material_cost=${materialCost}`);
  } catch (err) {
    // Non-fatal: log the error but don't fail the parent operation
    logger.error('Error syncing project financials', { projectId, error: err.message });
  }
};

// Get all vendors invited to a specific bid
const getBidVendors = async (req, res) => {
  try {
    const bidId = Number(req.params.bidId);
    if (!Number.isInteger(bidId) || bidId <= 0) {
      return sendError(res, 400, 'Invalid bid ID');
    }

    const sql = `
      SELECT 
        pv.id,
        pv.project_id,
        pv.vendor_company_id,
        pv.status,
        pv.proposal_price,
        pv.proposal_lead_time,
        pv.proposal_documents,
        pv.due_date,
        pv.created_at,
        pv.updated_at,
        c.company_name AS vendor_name,
        c.office_number AS vendor_phone,
        c.website AS vendor_website
      FROM project_vendors pv
      INNER JOIN companies c ON c.id = pv.vendor_company_id
      WHERE pv.project_id = ?
      ORDER BY pv.created_at DESC
    `;

    const [rows] = await db.query(sql, [bidId]);
    return sendSuccess(res, 'Bid vendors fetched successfully', { vendors: rows });
  } catch (error) {
    logger.error('Error fetching bid vendors', { error: error.message });
    return sendError(res, 500, 'Error fetching bid vendors');
  }
};

// Invite/add vendors to a bid
const inviteVendorsToBid = async (req, res) => {
  try {
    const bidId = Number(req.params.bidId);
    if (!Number.isInteger(bidId) || bidId <= 0) {
      return sendError(res, 400, 'Invalid bid ID');
    }

    const { vendor_company_ids, due_date, notes } = req.body;
    if (!Array.isArray(vendor_company_ids) || vendor_company_ids.length === 0) {
      return sendError(res, 400, 'vendor_company_ids must be a non-empty array');
    }

    // Check bid exists
    const [bidRows] = await db.query('SELECT id, project_status FROM projects WHERE id = ?', [bidId]);
    if (!bidRows || bidRows.length === 0) {
      return sendError(res, 404, 'Bid not found');
    }
    if (bidRows[0].project_status === 'completed') {
      return sendError(res, 400, 'Project is completed and cannot be modified.');
    }

    const insertPromises = vendor_company_ids.map(async (vendorCompanyId) => {
      // Check if already invited
      const [existing] = await db.query(
        'SELECT id FROM project_vendors WHERE project_id = ? AND vendor_company_id = ?',
        [bidId, vendorCompanyId]
      );
      if (existing && existing.length > 0) {
        return; // Already invited, skip
      }
      await db.query(
        'INSERT INTO project_vendors (project_id, vendor_company_id, status, due_date) VALUES (?, ?, ?, ?)',
        [bidId, vendorCompanyId, 'invited', due_date || null]
      );
    });

    await Promise.all(insertPromises);
    return sendSuccess(res, 'Vendors invited successfully');
  } catch (error) {
    logger.error('Error inviting vendors to bid', { error: error.message });
    return sendError(res, 500, 'Error inviting vendors to bid');
  }
};

// Employee approves vendor proposal
const approveVendorProposal = async (req, res) => {
  try {
    const bidId = Number(req.params.bidId);
    const vendorEntryId = Number(req.params.vendorEntryId);

    if (!Number.isInteger(bidId) || bidId <= 0 || !Number.isInteger(vendorEntryId) || vendorEntryId <= 0) {
      return sendError(res, 400, 'Invalid IDs');
    }

    const [bidRows] = await db.query('SELECT id, project_status FROM projects WHERE id = ?', [bidId]);
    if (!bidRows || bidRows.length === 0) { return sendError(res, 404, 'Project not found'); }
    if (bidRows[0].project_status === 'completed') { return sendError(res, 400, 'Project is completed and cannot be modified.'); }

    const [rows] = await db.query(
      'SELECT id, vendor_company_id, status FROM project_vendors WHERE id = ? AND project_id = ?',
      [vendorEntryId, bidId]
    );
    if (!rows || rows.length === 0) {
      return sendError(res, 404, 'Vendor entry not found');
    }

    if (rows[0].status === 'rejected') {
      return sendError(res, 400, 'Rejected proposals cannot be approved');
    }

    if (rows[0].status === 'invited') {
      return sendError(res, 400, 'Cannot approve a vendor proposal that is still in invited status');
    }

    await db.query(
      'UPDATE project_vendors SET status = ? WHERE id = ?',
      ['approved', vendorEntryId]
    );

    // Auto-sync financials after approval
    await syncProjectFinancials(bidId);

    return sendSuccess(res, 'Vendor proposal approved successfully');
  } catch (error) {
    logger.error('Error approving vendor proposal', { error: error.message });
    return sendError(res, 500, 'Error approving vendor proposal');
  }
};

// Employee rejects vendor proposal
const rejectVendorProposal = async (req, res) => {
  try {
    const bidId = Number(req.params.bidId);
    const vendorEntryId = Number(req.params.vendorEntryId);

    if (!Number.isInteger(bidId) || bidId <= 0 || !Number.isInteger(vendorEntryId) || vendorEntryId <= 0) {
      return sendError(res, 400, 'Invalid IDs');
    }

    const [bidRows] = await db.query('SELECT id, project_status FROM projects WHERE id = ?', [bidId]);
    if (!bidRows || bidRows.length === 0) { return sendError(res, 404, 'Project not found'); }
    if (bidRows[0].project_status === 'completed') { return sendError(res, 400, 'Project is completed and cannot be modified.'); }

    const { rejected_reason } = req.body;

    const [rows] = await db.query(
      'SELECT id, status FROM project_vendors WHERE id = ? AND project_id = ?',
      [vendorEntryId, bidId]
    );
    if (!rows || rows.length === 0) {
      return sendError(res, 404, 'Vendor entry not found');
    }

    if (rows[0].status === 'approved') {
      return sendError(res, 400, 'Approved proposals cannot be rejected');
    }

    await db.query(
      'UPDATE project_vendors SET status = ?, rejected_reason = ? WHERE id = ?',
      ['rejected', rejected_reason || null, vendorEntryId]
    );

    // Auto-sync financials after rejection (recalculates without this vendor)
    await syncProjectFinancials(bidId);

    return sendSuccess(res, 'Vendor proposal rejected successfully');
  } catch (error) {
    logger.error('Error rejecting vendor proposal', { error: error.message });
    return sendError(res, 500, 'Error rejecting vendor proposal');
  }
};

// Remove a vendor from bid
const removeVendorFromBid = async (req, res) => {
  try {
    const bidId = Number(req.params.bidId);
    const vendorEntryId = Number(req.params.vendorEntryId);

    if (!Number.isInteger(bidId) || bidId <= 0 || !Number.isInteger(vendorEntryId) || vendorEntryId <= 0) {
      return sendError(res, 400, 'Invalid IDs');
    }

    const [bidRows] = await db.query('SELECT id, project_status FROM projects WHERE id = ?', [bidId]);
    if (!bidRows || bidRows.length === 0) { return sendError(res, 404, 'Project not found'); }
    if (bidRows[0].project_status === 'completed') { return sendError(res, 400, 'Project is completed and cannot be modified.'); }

    const [rows] = await db.query(
      'SELECT status FROM project_vendors WHERE id = ? AND project_id = ?',
      [vendorEntryId, bidId]
    );
    if (!rows || rows.length === 0) {
      return sendError(res, 404, 'Vendor entry not found');
    }

    if (rows[0].status === 'approved') {
      return sendError(res, 400, 'Approved proposals cannot be deleted');
    }

    await db.query(
      'DELETE FROM project_vendors WHERE id = ? AND project_id = ?',
      [vendorEntryId, bidId]
    );

    return sendSuccess(res, 'Vendor removed from bid successfully');
  } catch (error) {
    logger.error('Error removing vendor from bid', { error: error.message });
    return sendError(res, 500, 'Error removing vendor from bid');
  }
};

// Get all vendor companies for selection
const getAvailableVendors = async (req, res) => {
  try {
    const bidId = Number(req.params.bidId);
    const search = req.query.search || '';

    const sql = `
      SELECT 
        c.id,
        c.company_name,
        c.office_number,
        c.website,
        CASE WHEN pv.id IS NOT NULL THEN 1 ELSE 0 END AS already_invited
      FROM companies c
      LEFT JOIN project_vendors pv ON pv.vendor_company_id = c.id AND pv.project_id = ?
      WHERE c.company_type = 'vendor'
      AND c.status = 'active'
      AND (c.is_temp = 0 OR (c.is_temp = 1 AND pv.id IS NOT NULL))
      ${search ? 'AND c.company_name LIKE ?' : ''}
      ORDER BY c.company_name ASC
      LIMIT 50
    `;

    const params = search ? [bidId, `%${search}%`] : [bidId];
    const [rows] = await db.query(sql, params);
    return sendSuccess(res, 'Available vendors fetched successfully', { vendors: rows });
  } catch (error) {
    logger.error('Error fetching available vendors', { error: error.message });
    return sendError(res, 500, 'Error fetching available vendors');
  }
};

// Add temporary external vendor and link to bid
const addExternalVendor = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const bidId = Number(req.params.bidId);
    if (!Number.isInteger(bidId) || bidId <= 0) {
      return sendError(res, 400, 'Invalid bid ID');
    }

    const [bidRows] = await connection.query('SELECT id, project_status FROM projects WHERE id = ?', [bidId]);
    if (!bidRows || bidRows.length === 0) {
      connection.release();
      return sendError(res, 404, 'Project not found');
    }
    if (bidRows[0].project_status === 'completed') {
      connection.release();
      return sendError(res, 400, 'Project is completed and cannot be modified.');
    }

    const {
      company_name,
      website,
      office_number,
      address,
      description,
      admin_first_name,
      admin_last_name,
      admin_email,
      admin_phone,
      admin_password
    } = req.body;

    if (!company_name || !admin_first_name || !admin_email) {
      return sendError(res, 400, 'Company Name, Admin First Name, and Email are required.');
    }

    await connection.beginTransaction();

    // Check company name
    const [existingComp] = await connection.query(
      'SELECT id FROM companies WHERE company_name = ?',
      [company_name]
    );
    if (existingComp && existingComp.length > 0) {
      await connection.rollback();
      return sendError(res, 400, 'A company with this name already exists.');
    }

    // Check employee email
    const [existingEmp] = await connection.query(
      'SELECT id FROM employees WHERE LOWER(email) = ?',
      [admin_email.toLowerCase()]
    );
    if (existingEmp && existingEmp.length > 0) {
      await connection.rollback();
      return sendError(res, 400, 'An employee with this email already exists.');
    }

    // Create temporary company
    const [companyResult] = await connection.query(
      `INSERT INTO companies (company_name, website, office_number, company_type, address, description, status, is_temp)
       VALUES (?, ?, ?, 'vendor', ?, ?, 'active', 1)`,
      [
        company_name,
        website || null,
        office_number || null,
        address || null,
        description || null
      ]
    );
    const newCompanyId = companyResult.insertId;

    // Create employee/user
    const passwordToHash = admin_password || admin_email;
    const hashedPassword = await bcryptjs.hash(passwordToHash.trim().toLowerCase(), 10);
    const [employeeResult] = await connection.query(
      `INSERT INTO employees (
         company_id, first_name, last_name, phone, email, password, role, is_admin, status, created_by
       )
       VALUES (?, ?, ?, ?, ?, ?, 'admin', 1, 'active', ?)`,
      [
        newCompanyId,
        admin_first_name,
        admin_last_name || '',
        admin_phone || '',
        admin_email,
        hashedPassword,
        req.user?.id || null
      ]
    );

    // Link company to bid in project_vendors
    const [existingLink] = await connection.query(
      'SELECT id FROM project_vendors WHERE project_id = ? AND vendor_company_id = ?',
      [bidId, newCompanyId]
    );
    if (!existingLink || existingLink.length === 0) {
      await connection.query(
        'INSERT INTO project_vendors (project_id, vendor_company_id, status) VALUES (?, ?, ?)',
        [bidId, newCompanyId, 'invited']
      );
    }

    await connection.commit();

    // Send welcome email asynchronously
    const { sendWelcomeEmail } = require('../services/auth/welcomeMailer');
    sendWelcomeEmail({
      email: admin_email,
      name: `${admin_first_name} ${admin_last_name || ''}`.trim(),
      roleType: 'vendor'
    }).catch(err => logger.error('Error sending vendor welcome email', { error: err.message }));

    return sendSuccess(res, 'Temporary external vendor added successfully', { companyId: newCompanyId });
  } catch (error) {
    await connection.rollback();
    logger.error('Error adding external vendor', { error: error.message });
    return sendError(res, 500, 'Error adding external vendor');
  } finally {
    connection.release();
  }
};

/**
 * Admin marks a project as fully completed.
 * Sets projects.project_status = 'completed'.
 * The project must be in 'won' bid_status to be completed.
 */
const completeProject = async (req, res) => {
  try {
    const bidId = Number(req.params.bidId);
    if (!Number.isInteger(bidId) || bidId <= 0) {
      return sendError(res, 400, 'Invalid bid ID');
    }

    // Validate the project exists and is in 'won' status
    const [rows] = await db.query(
      'SELECT id, bid_status, project_status FROM projects WHERE id = ?',
      [bidId]
    );
    if (!rows || rows.length === 0) {
      return sendError(res, 404, 'Project not found');
    }

    const project = rows[0];
    const bidStatus = String(project.bid_status || '').toLowerCase();
    if (bidStatus !== 'won') {
      return sendError(res, 400, `Project can only be completed when bid status is 'won'. Current status: '${project.bid_status}'.`);
    }

    if (project.project_status === 'completed') {
      return sendError(res, 400, 'Project is already marked as completed.');
    }

    await db.query(
      "UPDATE projects SET project_status = 'completed' WHERE id = ?",
      [bidId]
    );

    logger.info(`Project ${bidId} marked as completed by admin.`);
    return sendSuccess(res, 'Project marked as completed successfully');
  } catch (error) {
    logger.error('Error completing project', { error: error.message });
    return sendError(res, 500, 'Error completing project');
  }
};

module.exports = {
  getBidVendors,
  inviteVendorsToBid,
  approveVendorProposal,
  rejectVendorProposal,
  removeVendorFromBid,
  getAvailableVendors,
  addExternalVendor,
  completeProject,
};
