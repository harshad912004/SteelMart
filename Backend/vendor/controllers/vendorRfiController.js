const path = require('path');

const RfiModel = require('../../employee/models/rfiModel');
const logger = require('../../common/utils/logger');
const { sendSuccess, sendError, sendCreated, sendValidationError } = require('../../common/utils/apiResponse');
const { RFI_STATUSES, sanitizeStatus } = require('../../common/utils/projectWorkflow');
const { persistMulterUpload, removeStoredFile } = require('../../common/utils/projectWorkflowFiles');

const UPLOAD_ROOT = path.resolve(__dirname, '..', '..', 'uploads', 'rfi-files');

const toPositiveInteger = (value) => {
  const numericValue = Number(value);
  return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : null;
};

const safeRemoveStoredFile = async (relativeFilePath) => {
  if (!relativeFilePath) return;
  try {
    await removeStoredFile(UPLOAD_ROOT, relativeFilePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      logger.warn(`Unable to delete vendor RFI file: ${error.message}`);
    }
  }
};



const getProjectRfi = async (projectId, rfiId) => {
  const rfi = await RfiModel.getRFIByProjectIdAndId(projectId, rfiId);
  return rfi || null;
};

const getProjectRFIs = async (req, res) => {
  try {
    const projectId = toPositiveInteger(req.params.id);
    if (!projectId) return sendValidationError(res, 'Valid project ID is required.');


    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;
    const search = req.query.search || '';
    const status = req.query.status || 'all';

    const { rfis, totalRecords, totalPages } = await RfiModel.getRFIsByProjectId(projectId, page, limit, search, status);
    const statusCounts = await RfiModel.getStatusCounts(projectId);
    for (const rfi of rfis) {
      rfi.history = await RfiModel.getHistoryByRfiId(rfi.id);
    }

    return sendSuccess(res, 'Project RFIs fetched successfully', {
      rfis,
      totalRecords,
      totalPages,
      statusCounts,
    });
  } catch (error) {
    logger.error('Error fetching project RFIs (Vendor)', { error: error.message });
    return sendError(res, 500, 'Server error fetching RFIs');
  }
};

const getProjectRFIById = async (req, res) => {
  try {
    const projectId = toPositiveInteger(req.params.id);
    const rfiId = toPositiveInteger(req.params.rfiId);
    if (!projectId || !rfiId) return sendValidationError(res, 'Valid project ID and RFI ID are required.');


    const rfi = await getProjectRfi(projectId, rfiId);
    if (!rfi) return sendError(res, 404, 'RFI not found');

    const history = await RfiModel.getHistoryByRfiId(rfiId);
    return sendSuccess(res, 'Project RFI fetched successfully', { rfi, history });
  } catch (error) {
    logger.error('Error fetching project RFI (Vendor)', { error: error.message });
    return sendError(res, 500, 'Server error fetching RFI');
  }
};

const createProjectRFI = async (req, res) => {
  try {
    const projectId = toPositiveInteger(req.params.id);
    if (!projectId) return sendValidationError(res, 'Valid project ID is required.');


    const { title, priority, notes, description } = req.body;
    if (!title || !String(title).trim()) {
      return sendValidationError(res, 'Title is required');
    }

    const createdBy = req.user.id;
    const rfiId = await RfiModel.createRFI(
      projectId,
      String(title).trim(),
      priority,
      notes,
      description,
      'General Contractor',
      createdBy
    );

    await RfiModel.updateRFI(rfiId, { status: 'submitted', ball_in_court: 'General Contractor' });
    const rfi = await getProjectRfi(projectId, rfiId);
    return sendCreated(res, 'RFI created successfully', { rfi });
  } catch (error) {
    logger.error('Error creating RFI (Vendor)', { error: error.message });
    return sendError(res, 500, 'Server error creating RFI');
  }
};

const updateProjectRFI = async (req, res) => {
  try {
    const projectId = toPositiveInteger(req.params.id);
    const rfiId = toPositiveInteger(req.params.rfiId);
    if (!projectId || !rfiId) return sendValidationError(res, 'Valid project ID and RFI ID are required.');


    const rfi = await getProjectRfi(projectId, rfiId);
    if (!rfi) return sendError(res, 404, 'RFI not found');
    if (Number(rfi.created_by) !== Number(req.user.id)) {
      return sendError(res, 403, 'You can only update RFIs created by your account.');
    }

    const { title, notes, description, priority, status } = req.body;
    const normalizedStatus = status === undefined ? undefined : sanitizeStatus(status, RFI_STATUSES, null);
    if (status !== undefined && normalizedStatus === null) {
      return sendValidationError(res, 'Invalid RFI status.');
    }

    await RfiModel.updateRFI(rfiId, {
      title: title !== undefined ? String(title).trim() : undefined,
      notes,
      description,
      priority,
      status: normalizedStatus,
    });

    const updatedRfi = await getProjectRfi(projectId, rfiId);
    return sendSuccess(res, 'RFI updated successfully', { rfi: updatedRfi });
  } catch (error) {
    logger.error('Error updating RFI (Vendor)', { error: error.message });
    return sendError(res, 500, 'Server error updating RFI');
  }
};

const deleteProjectRFI = async (req, res) => {
  try {
    const projectId = toPositiveInteger(req.params.id);
    const rfiId = toPositiveInteger(req.params.rfiId);
    if (!projectId || !rfiId) return sendValidationError(res, 'Valid project ID and RFI ID are required.');


    const rfi = await getProjectRfi(projectId, rfiId);
    if (!rfi) return sendError(res, 404, 'RFI not found');
    if (Number(rfi.created_by) !== Number(req.user.id)) {
      return sendError(res, 403, 'You can only delete RFIs created by your account.');
    }

    const history = await RfiModel.getHistoryByRfiId(rfiId);
    for (const entry of history) {
      if (entry.file_url) await safeRemoveStoredFile(entry.file_url);
    }

    await RfiModel.deleteRFI(rfiId);
    return sendSuccess(res, 'RFI deleted successfully');
  } catch (error) {
    logger.error('Error deleting RFI (Vendor)', { error: error.message });
    return sendError(res, 500, 'Server error deleting RFI');
  }
};

const addProjectRFIHistory = async (req, res) => {
  try {
    const projectId = toPositiveInteger(req.params.id);
    const rfiId = toPositiveInteger(req.params.rfiId);
    if (!projectId || !rfiId) return sendValidationError(res, 'Valid project ID and RFI ID are required.');


    const rfi = await getProjectRfi(projectId, rfiId);
    if (!rfi) return sendError(res, 404, 'RFI not found');

    const message = String(req.body?.message || '').trim();
    if (!message && !req.file) {
      return sendValidationError(res, 'Message or attachment is required');
    }

    let storedFile = { relativePath: null, fileName: null };
    if (req.file) {
      storedFile = await persistMulterUpload({
        uploadRoot: UPLOAD_ROOT,
        relativeDirectory: `${projectId}/${rfiId}`,
        file: req.file,
      });
    }

    const historyId = await RfiModel.addHistory(
      rfiId,
      message || 'Attachment uploaded',
      storedFile.relativePath,
      storedFile.fileName,
      false,
      req.user.id
    );

    await RfiModel.updateRFI(rfiId, { status: 'responded', ball_in_court: 'General Contractor' });
    const history = await RfiModel.getHistoryById(historyId);
    return sendCreated(res, 'Reply added successfully', { history });
  } catch (error) {
    logger.error('Error adding RFI history (Vendor)', { error: error.message });
    return sendError(res, error.status || 500, error.status ? error.message : 'Server error adding history');
  }
};

module.exports = {
  getProjectRFIs,
  getProjectRFIById,
  createProjectRFI,
  updateProjectRFI,
  deleteProjectRFI,
  addProjectRFIHistory,
};
