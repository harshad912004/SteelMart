const path = require('path');
const BidModel = require('../models/bidModel');
const SubmittalModel = require('../models/submittalModel');
const logger = require('../../common/utils/logger');
const { sendSuccess, sendError, sendCreated, sendValidationError } = require('../../common/utils/apiResponse');
const { canManageEmployeeWorkflow, SUBMITTAL_STATUSES, sanitizeStatus } = require('../../common/utils/projectWorkflow');
const { persistBufferUpload, removeStoredFile } = require('../../common/utils/projectWorkflowFiles');

const UPLOAD_ROOT = path.resolve(__dirname, '..', '..', 'uploads', 'submittal-files');

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
      logger.warn(`Unable to delete stored Submittal file: ${error.message}`);
    }
  }
};

const assertEmployeeWorkflowAccess = (req, res, { write = false } = {}) => {
  if (!write || canManageEmployeeWorkflow(req.user)) return true;
  sendError(res, 403, 'You do not have permission to modify project Submittals.');
  return false;
};

const getProjectSubmittal = async (bidId, submittalId) => {
  const submittal = await SubmittalModel.getSubmittalByProjectIdAndId(bidId, submittalId);
  return submittal || null;
};

const getProjectVersion = async (submittalId, versionId) => {
  const version = await SubmittalModel.getVersionBySubmittalId(versionId, submittalId);
  return version || null;
};

const getSubmittals = async (req, res) => {
  try {
    const bidId = toPositiveInteger(req.params.bidId);
    if (!bidId) return sendValidationError(res, 'Valid bid id is required.');

    const bid = await BidModel.getBidById(bidId);
    if (!bid) return sendError(res, 404, 'Bid not found.');

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;
    const search = req.query.search || '';
    const status = req.query.status || 'all';

    const { submittals, totalRecords, totalPages } = await SubmittalModel.getSubmittalsByProjectId(bidId, page, limit, search, status);
    const statusCounts = await SubmittalModel.getStatusCounts(bidId);

    return sendSuccess(res, 'Submittals fetched successfully', {
      submittals,
      totalRecords,
      totalPages,
      statusCounts,
    });
  } catch (error) {
    logger.error(`Error fetching Submittals: ${error.message}`);
    return sendError(res, 500, 'Error fetching Submittals.');
  }
};

const getSubmittal = async (req, res) => {
  try {
    const bidId = toPositiveInteger(req.params.bidId);
    const submittalId = toPositiveInteger(req.params.submittalId);
    if (!bidId || !submittalId) return sendValidationError(res, 'Valid bid ID and Submittal ID are required.');

    const bid = await BidModel.getBidById(bidId);
    if (!bid) return sendError(res, 404, 'Bid not found.');

    const submittal = await getProjectSubmittal(bidId, submittalId);
    if (!submittal) return sendError(res, 404, 'Submittal not found.');

    const versions = await SubmittalModel.getVersionsBySubmittalId(submittalId);
    for (const version of versions) {
      version.replies = await SubmittalModel.getRepliesByVersionId(version.id);
    }

    return sendSuccess(res, 'Submittal fetched successfully', { submittal, versions });
  } catch (error) {
    logger.error(`Error fetching Submittal: ${error.message}`);
    return sendError(res, 500, 'Error fetching Submittal.');
  }
};

const createSubmittal = async (req, res) => {
  try {
    const bidId = toPositiveInteger(req.params.bidId);
    if (!bidId) return sendValidationError(res, 'Valid bid id is required.');
    if (!assertEmployeeWorkflowAccess(req, res, { write: true })) return;

    const bid = await BidModel.getBidById(bidId);
    if (!bid) return sendError(res, 404, 'Bid not found.');

    const { title, type, due_date, priority, description, ball_in_court, status } = req.body;
    if (!title || !String(title).trim()) return sendValidationError(res, 'Title is required.');

    const normalizedStatus = sanitizeStatus(status, SUBMITTAL_STATUSES, 'open');
    if (status !== undefined && normalizedStatus === null) {
      return sendValidationError(res, 'Invalid Submittal status.');
    }

    const createdBy = req.user?.id || null;
    const submittalId = await SubmittalModel.createSubmittal(
      bidId,
      String(title).trim(),
      type,
      due_date,
      priority,
      description,
      ball_in_court || null,
      createdBy
    );

    if (normalizedStatus && normalizedStatus !== 'open') {
      await SubmittalModel.updateSubmittal(submittalId, { status: normalizedStatus });
    }

    const submittal = await getProjectSubmittal(bidId, submittalId);
    return sendCreated(res, 'Submittal created successfully', { submittal });
  } catch (error) {
    logger.error(`Error creating Submittal: ${error.message}`);
    return sendError(res, 500, 'Error creating Submittal.');
  }
};

const updateSubmittal = async (req, res) => {
  try {
    const bidId = toPositiveInteger(req.params.bidId);
    const submittalId = toPositiveInteger(req.params.submittalId);
    if (!bidId || !submittalId) return sendValidationError(res, 'Valid bid ID and Submittal ID are required.');
    if (!assertEmployeeWorkflowAccess(req, res, { write: true })) return;

    const submittal = await getProjectSubmittal(bidId, submittalId);
    if (!submittal) return sendError(res, 404, 'Submittal not found.');

    const { title, type, due_date, priority, description, status, ball_in_court } = req.body;
    const normalizedStatus = status === undefined ? undefined : sanitizeStatus(status, SUBMITTAL_STATUSES, null);
    if (status !== undefined && normalizedStatus === null) {
      return sendValidationError(res, 'Invalid Submittal status.');
    }

    await SubmittalModel.updateSubmittal(submittalId, {
      title: title !== undefined ? String(title).trim() : undefined,
      type,
      due_date,
      priority,
      description,
      status: normalizedStatus,
      ball_in_court,
    });

    const updatedSubmittal = await getProjectSubmittal(bidId, submittalId);
    return sendSuccess(res, 'Submittal updated successfully', { submittal: updatedSubmittal });
  } catch (error) {
    logger.error(`Error updating Submittal: ${error.message}`);
    return sendError(res, 500, 'Error updating Submittal.');
  }
};

const deleteSubmittal = async (req, res) => {
  try {
    const bidId = toPositiveInteger(req.params.bidId);
    const submittalId = toPositiveInteger(req.params.submittalId);
    if (!bidId || !submittalId) return sendValidationError(res, 'Valid bid ID and Submittal ID are required.');
    if (!assertEmployeeWorkflowAccess(req, res, { write: true })) return;

    const submittal = await getProjectSubmittal(bidId, submittalId);
    if (!submittal) return sendError(res, 404, 'Submittal not found.');

    const versions = await SubmittalModel.getVersionsBySubmittalId(submittalId);
    for (const version of versions) {
      if (version.file_url) await safeRemoveStoredFile(version.file_url);
      for (const reply of await SubmittalModel.getRepliesByVersionId(version.id)) {
        if (reply.file_url) await safeRemoveStoredFile(reply.file_url);
      }
    }

    await SubmittalModel.deleteSubmittal(submittalId);
    return sendSuccess(res, 'Submittal deleted successfully');
  } catch (error) {
    logger.error(`Error deleting Submittal: ${error.message}`);
    return sendError(res, 500, 'Error deleting Submittal.');
  }
};

const addVersion = async (req, res) => {
  try {
    const bidId = toPositiveInteger(req.params.bidId);
    const submittalId = toPositiveInteger(req.params.submittalId);
    if (!bidId || !submittalId) return sendValidationError(res, 'Valid bid ID and Submittal ID are required.');
    if (!assertEmployeeWorkflowAccess(req, res, { write: true })) return;

    const submittal = await getProjectSubmittal(bidId, submittalId);
    if (!submittal) return sendError(res, 404, 'Submittal not found.');

    const createdBy = req.user?.id || null;
    const parsedBody = parseMaybeRawBody(req.body);
    const requestedStatus = req.headers['x-status'] || parsedBody.status;
    const normalizedStatus = sanitizeStatus(requestedStatus, SUBMITTAL_STATUSES, 'open');
    if (requestedStatus !== undefined && normalizedStatus === null) {
      return sendValidationError(res, 'Invalid Submittal status.');
    }

    if (req.headers['x-file-name']) {
      const originalFileName = req.headers['x-file-name'];
      const message = req.headers['x-message'] ? decodeURIComponent(req.headers['x-message']) : '';

      if (!originalFileName) return sendValidationError(res, 'File name header is missing.');

      const storedFile = await persistBufferUpload({
        uploadRoot: UPLOAD_ROOT,
        relativeDirectory: `${bidId}/${submittalId}`,
        originalFileName,
        buffer: req.body,
      });

      const versionId = await SubmittalModel.addVersion(
        submittalId,
        message || 'Version uploaded',
        normalizedStatus || 'open',
        storedFile.relativePath,
        storedFile.fileName,
        createdBy
      );
      const version = await SubmittalModel.getVersionById(versionId);
      return sendCreated(res, 'Version added successfully', { version });
    }

    const { message, status } = parsedBody;
    const entryStatus = sanitizeStatus(status, SUBMITTAL_STATUSES, 'open');
    if (status !== undefined && entryStatus === null) {
      return sendValidationError(res, 'Invalid Submittal status.');
    }
    if (!message || !String(message).trim()) {
      return sendValidationError(res, 'Message is required if no file is uploaded.');
    }

    const versionId = await SubmittalModel.addVersion(submittalId, String(message).trim(), entryStatus || 'open', null, null, createdBy);
    const version = await SubmittalModel.getVersionById(versionId);
    return sendCreated(res, 'Version added successfully', { version });
  } catch (error) {
    logger.error(`Error adding Submittal version: ${error.message}`);
    return sendError(res, error.status || 500, error.status ? error.message : 'Error adding version.');
  }
};

const addReply = async (req, res) => {
  try {
    const bidId = toPositiveInteger(req.params.bidId);
    const submittalId = toPositiveInteger(req.params.submittalId);
    const versionId = toPositiveInteger(req.params.versionId);
    if (!bidId || !submittalId || !versionId) {
      return sendValidationError(res, 'Valid bid ID, Submittal ID and Version ID are required.');
    }
    if (!assertEmployeeWorkflowAccess(req, res, { write: true })) return;

    const submittal = await getProjectSubmittal(bidId, submittalId);
    if (!submittal) return sendError(res, 404, 'Submittal not found.');

    const version = await getProjectVersion(submittalId, versionId);
    if (!version) return sendError(res, 404, 'Version not found.');

    const { message } = req.body;
    if (!message || !String(message).trim()) return sendValidationError(res, 'Message is required.');

    const createdBy = req.user?.id || null;
    const replyId = await SubmittalModel.addReply(submittalId, versionId, String(message).trim(), createdBy);
    const reply = await SubmittalModel.getVersionById(replyId);
    return sendCreated(res, 'Reply added successfully', { reply });
  } catch (error) {
    logger.error(`Error adding Submittal reply: ${error.message}`);
    return sendError(res, 500, 'Error adding reply.');
  }
};

const updateReply = async (req, res) => {
  try {
    const bidId = toPositiveInteger(req.params.bidId);
    const submittalId = toPositiveInteger(req.params.submittalId);
    const versionId = toPositiveInteger(req.params.versionId);
    if (!bidId || !submittalId || !versionId) {
      return sendValidationError(res, 'Valid bid ID, Submittal ID and Version ID are required.');
    }
    if (!assertEmployeeWorkflowAccess(req, res, { write: true })) return;

    const submittal = await getProjectSubmittal(bidId, submittalId);
    if (!submittal) return sendError(res, 404, 'Submittal not found.');

    const version = await getProjectVersion(submittalId, versionId);
    if (!version) return sendError(res, 404, 'Entry not found.');

    const { message, status } = req.body;
    const normalizedStatus = status === undefined ? undefined : sanitizeStatus(status, SUBMITTAL_STATUSES, null);
    if (status !== undefined && normalizedStatus === null) {
      return sendValidationError(res, 'Invalid Submittal status.');
    }

    await SubmittalModel.updateVersion(
      versionId,
      message !== undefined ? String(message).trim() : undefined,
      normalizedStatus
    );

    const updatedVersion = await SubmittalModel.getVersionById(versionId);
    return sendSuccess(res, 'Entry updated successfully', { version: updatedVersion });
  } catch (error) {
    logger.error(`Error updating Submittal entry: ${error.message}`);
    return sendError(res, 500, 'Error updating entry.');
  }
};

const deleteVersion = async (req, res) => {
  try {
    const bidId = toPositiveInteger(req.params.bidId);
    const submittalId = toPositiveInteger(req.params.submittalId);
    const versionId = toPositiveInteger(req.params.versionId);
    if (!bidId || !submittalId || !versionId) {
      return sendValidationError(res, 'Valid bid ID, Submittal ID and Version ID are required.');
    }
    if (!assertEmployeeWorkflowAccess(req, res, { write: true })) return;

    const submittal = await getProjectSubmittal(bidId, submittalId);
    if (!submittal) return sendError(res, 404, 'Submittal not found.');

    const version = await getProjectVersion(submittalId, versionId);
    if (!version) return sendError(res, 404, 'Entry not found.');

    if (version.file_url) await safeRemoveStoredFile(version.file_url);

    await SubmittalModel.deleteVersion(versionId);
    return sendSuccess(res, 'Entry deleted successfully');
  } catch (error) {
    logger.error(`Error deleting Submittal entry: ${error.message}`);
    return sendError(res, 500, 'Error deleting entry.');
  }
};

const getProjectsWithSubmittals = async (req, res) => {
  try {
    const projects = await SubmittalModel.getProjectsWithSubmittals();
    return sendSuccess(res, 'Projects with Submittals fetched successfully', { projects });
  } catch (error) {
    logger.error(`Error fetching projects with Submittals: ${error.message}`);
    return sendError(res, 500, 'Error fetching projects with Submittals.');
  }
};

module.exports = {
  getSubmittals,
  getSubmittal,
  createSubmittal,
  updateSubmittal,
  deleteSubmittal,
  addVersion,
  addReply,
  updateReply,
  deleteVersion,
  getProjectsWithSubmittals,
};
