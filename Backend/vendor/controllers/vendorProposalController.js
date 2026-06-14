const db = require('../../config/db');
const fs = require('fs');
const path = require('path');
const logger = require('../../common/utils/logger');
const { sendSuccess, sendError } = require('../../common/utils/apiResponse');

// ─── Extension whitelist for vendor proposal documents ─────────────────────
const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.doc', '.docx', '.xls', '.xlsx',
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.txt', '.csv',
]);


const PROPOSAL_UPLOADS_DIR = path.join(__dirname, '../../uploads/vendor_proposals');

// Ensure the upload directory exists
const ensureUploadDir = (projectId) => {
  const dir = path.join(PROPOSAL_UPLOADS_DIR, String(projectId));
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

// Vendor submits a proposal for a project they were invited to
const submitProposal = async (req, res) => {
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

    // Parse multipart or JSON body
    let price, lead_time, files;

    if (req.is && req.is('multipart/form-data') && req.files) {
      // Multipart form data with file uploads
      price = req.body?.price;
      lead_time = req.body?.lead_time;
      files = req.files;
    } else if (Buffer.isBuffer(req.body)) {
      // Raw body - parse as JSON
      try {
        const parsed = JSON.parse(req.body.toString());
        price = parsed.price;
        lead_time = parsed.lead_time;
      } catch {
        return sendError(res, 400, 'Invalid request body');
      }
    } else {
      price = req.body?.price;
      lead_time = req.body?.lead_time;
    }

    if (price === undefined || price === null || price === '') {
      return sendError(res, 400, 'Price is required to submit a proposal');
    }

    // Check if vendor is invited to this project and get project due_date
    const [rows] = await db.query(
      'SELECT pv.id, pv.status, p.due_date FROM project_vendors pv JOIN projects p ON pv.project_id = p.id WHERE pv.project_id = ? AND pv.vendor_company_id = ?',
      [projectId, vendorCompanyId]
    );

    if (!rows || rows.length === 0) {
      return sendError(res, 403, 'You are not invited to this project');
    }

    const vendorEntry = rows[0];
    if (vendorEntry.status !== 'invited') {
      const msgMap = {
        approved: 'Proposal already approved. No further submissions allowed.',
        proposal_sent: 'You have already submitted a proposal for this project.',
        not_bidding: 'You have opted out of bidding on this project.',
        rejected: 'Your previous proposal was rejected. Contact admin for next steps.',
      };
      const msg = msgMap[vendorEntry.status] || `Cannot submit proposal when status is '${vendorEntry.status}'.`;
      return sendError(res, 400, msg);
    }

    // Handle file uploads
    let documentPaths = null;
    if (files && Array.isArray(files) && files.length > 0) {
      const uploadDir = ensureUploadDir(projectId);
      const savedPaths = [];

      for (const file of files) {
        const ext = path.extname(file.originalname).toLowerCase();

        // Validate extension against whitelist before saving
        if (!ALLOWED_EXTENSIONS.has(ext)) {
          // Clean up any files already saved in this loop
          for (const p of savedPaths) {
            try { fs.unlinkSync(path.join(PROPOSAL_UPLOADS_DIR, '..', p)); } catch (_) {}
          }
          return sendError(res, 400, `File type '${ext || 'unknown'}' is not allowed. Only PDF, DOCX, XLS, and image files are accepted.`);
        }

        const timestamp = Date.now();
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filename = `vendor_${vendorCompanyId}_${timestamp}_${safeName}`;
        const filePath = path.join(uploadDir, filename);

        // multer diskStorage saves to file.path. We move it to the target directory.
        if (file.path) {
          try {
            fs.renameSync(file.path, filePath);
          } catch (err) {
            // fallback if crossing partition boundaries
            fs.copyFileSync(file.path, filePath);
            fs.unlinkSync(file.path);
          }
        } else if (file.buffer) {
          // fallback if memoryStorage is used
          fs.writeFileSync(filePath, file.buffer);
        }
        
        savedPaths.push(`vendor_proposals/${projectId}/${filename}`);
      }

      documentPaths = JSON.stringify(savedPaths);
    }

    // Calculate vendor due_date = project due_date + lead_time
    let computedDueDate = null;
    if (vendorEntry.due_date) {
      const pDate = new Date(vendorEntry.due_date);
      if (!isNaN(pDate)) {
        if (lead_time && !isNaN(Number(lead_time))) {
          pDate.setDate(pDate.getDate() + Number(lead_time));
        }
        computedDueDate = pDate.toISOString().split('T')[0];
      }
    }

    // Update the proposal with pricing and mark as proposal_sent
    let updateSql = 'UPDATE project_vendors SET status = ?, proposal_price = ?, proposal_lead_time = ?, due_date = ?';
    const updateParams = ['proposal_sent', price, lead_time || null, computedDueDate];

    if (documentPaths) {
      updateSql += ', proposal_documents = ?';
      updateParams.push(documentPaths);
    }

    updateSql += ', updated_at = NOW() WHERE id = ?';
    updateParams.push(vendorEntry.id);

    await db.query(updateSql, updateParams);

    return sendSuccess(res, 'Proposal submitted successfully');
  } catch (error) {
    logger.error('Error submitting vendor proposal', { error: error.message });
    return sendError(res, 500, 'Error submitting vendor proposal');
  }
};

module.exports = { submitProposal };
