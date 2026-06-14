const path = require('path');
const BidModel = require('../models/bidModel');
const RFIModel = require('../models/rfiModel');
const logger = require('../../common/utils/logger');
const { sendSuccess, sendError, sendCreated, sendValidationError } = require('../../common/utils/apiResponse');
const { canManageEmployeeWorkflow, RFI_STATUSES, sanitizeStatus } = require('../../common/utils/projectWorkflow');
const { persistBufferUpload, removeStoredFile } = require('../../common/utils/projectWorkflowFiles');

const UPLOAD_ROOT = path.resolve(__dirname, '..', '..', 'uploads', 'rfi-files');

const toPositiveInteger = (value) => {
  const numericValue = Number(value);
  return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : null;
};

const parseMaybeRawBody = (body) => {
  if (Buffer.isBuffer(body)) {
    const text = body.toString('utf8').trim();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch (error) {
      return {};
    }
  }
  return body || {};
};

const safeRemoveStoredFile = async (relativeFilePath) => {
  if (!relativeFilePath) return;
  try {
    await removeStoredFile(UPLOAD_ROOT, relativeFilePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      logger.warn(`Unable to delete stored RFI file: ${error.message}`);
    }
  }
};

const assertEmployeeWorkflowAccess = (req, res, { write = false } = {}) => {
  if (!write || canManageEmployeeWorkflow(req.user)) return true;
  sendError(res, 403, 'You do not have permission to modify project RFIs.');
  return false;
};

const getProjectRfi = async (bidId, rfiId) => {
  const rfi = await RFIModel.getRFIByProjectIdAndId(bidId, rfiId);
  return rfi || null;
};

const getRFIs = async (req, res) => {
  try {
    const bidId = toPositiveInteger(req.params.bidId);
    if (!bidId) return sendValidationError(res, 'Valid bid id is required.');

    const bid = await BidModel.getBidById(bidId);
    if (!bid) return sendError(res, 404, 'Bid not found.');

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;
    const search = req.query.search || '';
    const status = req.query.status || 'all';

    const { rfis, totalRecords, totalPages } = await RFIModel.getRFIsByProjectId(bidId, page, limit, search, status);
    const statusCounts = await RFIModel.getStatusCounts(bidId);

    for (const rfi of rfis) {
      rfi.history = await RFIModel.getHistoryByRfiId(rfi.id);
    }

    return sendSuccess(res, 'RFIs fetched successfully', { rfis, totalRecords, totalPages, statusCounts });
  } catch (error) {
    logger.error(`Error fetching RFIs: ${error.message}`);
    return sendError(res, 500, 'Error fetching RFIs.');
  }
};

const getRFI = async (req, res) => {
  try {
    const bidId = toPositiveInteger(req.params.bidId);
    const rfiId = toPositiveInteger(req.params.rfiId);
    if (!bidId || !rfiId) return sendValidationError(res, 'Valid bid ID and RFI ID are required.');

    const bid = await BidModel.getBidById(bidId);
    if (!bid) return sendError(res, 404, 'Bid not found.');

    const rfi = await getProjectRfi(bidId, rfiId);
    if (!rfi) return sendError(res, 404, 'RFI not found.');

    const history = await RFIModel.getHistoryByRfiId(rfiId);
    return sendSuccess(res, 'RFI fetched successfully', { rfi, history });
  } catch (error) {
    logger.error(`Error fetching RFI: ${error.message}`);
    return sendError(res, 500, 'Error fetching RFI.');
  }
};

const createRFI = async (req, res) => {
  try {
    const bidId = toPositiveInteger(req.params.bidId);
    if (!bidId) return sendValidationError(res, 'Valid bid id is required.');
    if (!assertEmployeeWorkflowAccess(req, res, { write: true })) return;

    const bid = await BidModel.getBidById(bidId);
    if (!bid) return sendError(res, 404, 'Bid not found.');

    const { title, priority, notes, description, ball_in_court, status } = req.body;
    if (!title || !String(title).trim()) return sendValidationError(res, 'Title is required.');

    const normalizedStatus = sanitizeStatus(status, RFI_STATUSES, 'open');
    if (status !== undefined && normalizedStatus === null) {
      return sendValidationError(res, 'Invalid RFI status.');
    }

    const createdBy = req.user?.id || null;
    const rfiId = await RFIModel.createRFI(
      bidId,
      String(title).trim(),
      priority,
      notes,
      description,
      ball_in_court || null,
      createdBy
    );

    if (normalizedStatus && normalizedStatus !== 'open') {
      await RFIModel.updateRFI(rfiId, { status: normalizedStatus });
    }

    const rfi = await getProjectRfi(bidId, rfiId);
    return sendCreated(res, 'RFI created successfully', { rfi });
  } catch (error) {
    logger.error(`Error creating RFI: ${error.message}`);
    return sendError(res, 500, 'Error creating RFI.');
  }
};

const updateRFI = async (req, res) => {
  try {
    const bidId = toPositiveInteger(req.params.bidId);
    const rfiId = toPositiveInteger(req.params.rfiId);
    if (!bidId || !rfiId) return sendValidationError(res, 'Valid bid ID and RFI ID are required.');
    if (!assertEmployeeWorkflowAccess(req, res, { write: true })) return;

    const rfi = await getProjectRfi(bidId, rfiId);
    if (!rfi) return sendError(res, 404, 'RFI not found.');

    const { title, notes, priority, description, status, ball_in_court } = req.body;
    const normalizedStatus = status === undefined ? undefined : sanitizeStatus(status, RFI_STATUSES, null);
    if (status !== undefined && normalizedStatus === null) {
      return sendValidationError(res, 'Invalid RFI status.');
    }

    await RFIModel.updateRFI(rfiId, {
      title: title !== undefined ? String(title).trim() : undefined,
      notes,
      priority,
      description,
      status: normalizedStatus,
      ball_in_court,
    });

    const updatedRfi = await getProjectRfi(bidId, rfiId);
    return sendSuccess(res, 'RFI updated successfully', { rfi: updatedRfi });
  } catch (error) {
    logger.error(`Error updating RFI: ${error.message}`);
    return sendError(res, 500, 'Error updating RFI.');
  }
};

const deleteRFI = async (req, res) => {
  try {
    const bidId = toPositiveInteger(req.params.bidId);
    const rfiId = toPositiveInteger(req.params.rfiId);
    if (!bidId || !rfiId) return sendValidationError(res, 'Valid bid ID and RFI ID are required.');
    if (!assertEmployeeWorkflowAccess(req, res, { write: true })) return;

    const rfi = await getProjectRfi(bidId, rfiId);
    if (!rfi) return sendError(res, 404, 'RFI not found.');

    const history = await RFIModel.getHistoryByRfiId(rfiId);
    for (const entry of history) {
      if (entry.file_url) await safeRemoveStoredFile(entry.file_url);
    }

    await RFIModel.deleteRFI(rfiId);
    return sendSuccess(res, 'RFI deleted successfully');
  } catch (error) {
    logger.error(`Error deleting RFI: ${error.message}`);
    return sendError(res, 500, 'Error deleting RFI.');
  }
};

const addHistory = async (req, res) => {
  try {
    const bidId = toPositiveInteger(req.params.bidId);
    const rfiId = toPositiveInteger(req.params.rfiId);
    if (!bidId || !rfiId) return sendValidationError(res, 'Valid bid ID and RFI ID are required.');
    if (!assertEmployeeWorkflowAccess(req, res, { write: true })) return;

    const rfi = await getProjectRfi(bidId, rfiId);
    if (!rfi) return sendError(res, 404, 'RFI not found.');

    const createdBy = req.user?.id || null;
    const parsedBody = parseMaybeRawBody(req.body);
    const requestedStatus = req.headers['x-status'] || parsedBody.status;
    const normalizedStatus = requestedStatus === undefined
      ? undefined
      : sanitizeStatus(requestedStatus, RFI_STATUSES, null);

    if (requestedStatus !== undefined && normalizedStatus === null) {
      return sendValidationError(res, 'Invalid RFI status.');
    }

    if (req.headers['x-file-name']) {
      const originalFileName = req.headers['x-file-name'];
      const message = req.headers['x-message'] ? decodeURIComponent(req.headers['x-message']) : '';
      const isReplyOnly = req.headers['x-reply-only'] === '1';

      if (!originalFileName) return sendValidationError(res, 'File name header is missing.');
      if (!message && !originalFileName) return sendValidationError(res, 'Message or file is required.');

      const storedFile = await persistBufferUpload({
        uploadRoot: UPLOAD_ROOT,
        relativeDirectory: `${bidId}/${rfiId}`,
        originalFileName,
        buffer: req.body,
      });

      const historyId = await RFIModel.addHistory(
        rfiId,
        message || 'Attachment uploaded',
        storedFile.relativePath,
        storedFile.fileName,
        isReplyOnly,
        createdBy
      );

      if (normalizedStatus) {
        await RFIModel.updateRFI(rfiId, { status: normalizedStatus });
      }

      const history = await RFIModel.getHistoryById(historyId);
      return sendCreated(res, 'History added successfully', { history });
    }

    const { message, is_reply_only } = parsedBody;
    if (!message || !String(message).trim()) {
      return sendValidationError(res, 'Message is required if no file is uploaded.');
    }

    const historyId = await RFIModel.addHistory(rfiId, String(message).trim(), null, null, is_reply_only, createdBy);
    if (normalizedStatus) {
      await RFIModel.updateRFI(rfiId, { status: normalizedStatus });
    }

    const history = await RFIModel.getHistoryById(historyId);
    return sendCreated(res, 'History added successfully', { history });
  } catch (error) {
    logger.error(`Error adding RFI history: ${error.message}`);
    return sendError(res, error.status || 500, error.status ? error.message : 'Error adding history.');
  }
};

const deleteHistory = async (req, res) => {
  try {
    const bidId = toPositiveInteger(req.params.bidId);
    const rfiId = toPositiveInteger(req.params.rfiId);
    const historyId = toPositiveInteger(req.params.historyId);
    if (!bidId || !rfiId || !historyId) {
      return sendValidationError(res, 'Valid bid ID, RFI ID, and History ID are required.');
    }
    if (!assertEmployeeWorkflowAccess(req, res, { write: true })) return;

    const rfi = await getProjectRfi(bidId, rfiId);
    if (!rfi) return sendError(res, 404, 'RFI not found.');

    const history = await RFIModel.getHistoryById(historyId);
    if (!history || Number(history.rfi_id) !== rfiId) {
      return sendError(res, 404, 'History entry not found.');
    }

    if (history.file_url) await safeRemoveStoredFile(history.file_url);

    await RFIModel.deleteHistory(historyId);
    return sendSuccess(res, 'History entry deleted successfully');
  } catch (error) {
    logger.error(`Error deleting RFI history: ${error.message}`);
    return sendError(res, 500, 'Error deleting history.');
  }
};

const getProjectsWithRFIs = async (req, res) => {
  try {
    const projects = await RFIModel.getProjectsWithRFIs();
    return sendSuccess(res, 'Projects with RFIs fetched successfully', { projects });
  } catch (error) {
    logger.error(`Error fetching projects with RFIs: ${error.message}`);
    return sendError(res, 500, 'Error fetching projects with RFIs.');
  }
};

module.exports = {
  getRFIs,
  getRFI,
  createRFI,
  updateRFI,
  deleteRFI,
  addHistory,
  deleteHistory,
  getProjectsWithRFIs,
};
