const path = require('path');

const SubmittalModel = require('../../employee/models/submittalModel');
const logger = require('../../common/utils/logger');
const { sendSuccess, sendError, sendCreated, sendValidationError } = require('../../common/utils/apiResponse');
const { SUBMITTAL_STATUSES, sanitizeStatus } = require('../../common/utils/projectWorkflow');
const { persistMulterUpload, removeStoredFile } = require('../../common/utils/projectWorkflowFiles');

const UPLOAD_ROOT = path.resolve(__dirname, '..', '..', 'uploads', 'submittal-files');

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
      logger.warn(`Unable to delete vendor Submittal file: ${error.message}`);
    }
  }
};



const getProjectSubmittal = async (projectId, submittalId) => {
  const submittal = await SubmittalModel.getSubmittalByProjectIdAndId(projectId, submittalId);
  return submittal || null;
};

const getProjectVersion = async (submittalId, versionId) => {
  const version = await SubmittalModel.getVersionBySubmittalId(versionId, submittalId);
  return version || null;
};

const getProjectSubmittals = async (req, res) => {
  try {
    const projectId = toPositiveInteger(req.params.id);
    if (!projectId) return sendValidationError(res, 'Valid project ID is required.');


    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;
    const search = req.query.search || '';
    const status = req.query.status || 'all';

    const { submittals, totalRecords, totalPages } = await SubmittalModel.getSubmittalsByProjectId(projectId, page, limit, search, status);
    const statusCounts = await SubmittalModel.getStatusCounts(projectId);
    return sendSuccess(res, 'Project Submittals fetched successfully', {
      submittals,
      totalRecords,
      totalPages,
      statusCounts,
    });
  } catch (error) {
    logger.error('Error fetching project Submittals (Vendor)', { error: error.message });
    return sendError(res, 500, 'Server error fetching Submittals');
  }
};

const getProjectSubmittalById = async (req, res) => {
  try {
    const projectId = toPositiveInteger(req.params.id);
    const submittalId = toPositiveInteger(req.params.submittalId);
    if (!projectId || !submittalId) return sendValidationError(res, 'Valid project ID and Submittal ID are required.');


    const submittal = await getProjectSubmittal(projectId, submittalId);
    if (!submittal) return sendError(res, 404, 'Submittal not found');

    const versions = await SubmittalModel.getVersionsBySubmittalId(submittalId);
    for (const version of versions) {
      version.replies = await SubmittalModel.getRepliesByVersionId(version.id);
    }

    return sendSuccess(res, 'Project Submittal fetched successfully', { submittal, versions });
  } catch (error) {
    logger.error('Error fetching project Submittal (Vendor)', { error: error.message });
    return sendError(res, 500, 'Server error fetching Submittal');
  }
};

const createProjectSubmittal = async (req, res) => {
  try {
    const projectId = toPositiveInteger(req.params.id);
    if (!projectId) return sendValidationError(res, 'Valid project ID is required.');


    const { title, description, due_date, type, priority } = req.body;
    if (!title || !String(title).trim()) {
      return sendValidationError(res, 'Title is required');
    }

    const createdBy = req.user.id;
    const submittalId = await SubmittalModel.createSubmittal(
      projectId,
      String(title).trim(),
      type || 'Shop Drawing',
      due_date || null,
      priority || 'Medium',
      description || null,
      'General Contractor',
      createdBy
    );

    await SubmittalModel.updateSubmittal(submittalId, { status: 'submitted', ball_in_court: 'General Contractor' });
    const submittal = await getProjectSubmittal(projectId, submittalId);
    return sendCreated(res, 'Submittal created successfully', { submittal });
  } catch (error) {
    logger.error('Error creating project Submittal (Vendor)', { error: error.message });
    return sendError(res, 500, 'Server error creating Submittal');
  }
};

const updateProjectSubmittal = async (req, res) => {
  try {
    const projectId = toPositiveInteger(req.params.id);
    const submittalId = toPositiveInteger(req.params.submittalId);
    if (!projectId || !submittalId) return sendValidationError(res, 'Valid project ID and Submittal ID are required.');


    const submittal = await getProjectSubmittal(projectId, submittalId);
    if (!submittal) return sendError(res, 404, 'Submittal not found');
    if (Number(submittal.created_by) !== Number(req.user.id)) {
      return sendError(res, 403, 'You can only update Submittals created by your account.');
    }

    const { title, description, due_date, type, priority, status } = req.body;
    const normalizedStatus = status === undefined ? undefined : sanitizeStatus(status, SUBMITTAL_STATUSES, null);
    if (status !== undefined && normalizedStatus === null) {
      return sendValidationError(res, 'Invalid Submittal status.');
    }

    await SubmittalModel.updateSubmittal(submittalId, {
      title: title !== undefined ? String(title).trim() : undefined,
      description,
      due_date,
      type,
      priority,
      status: normalizedStatus,
    });

    const updatedSubmittal = await getProjectSubmittal(projectId, submittalId);
    return sendSuccess(res, 'Submittal updated successfully', { submittal: updatedSubmittal });
  } catch (error) {
    logger.error('Error updating project Submittal (Vendor)', { error: error.message });
    return sendError(res, 500, 'Server error updating Submittal');
  }
};

const deleteProjectSubmittal = async (req, res) => {
  try {
    const projectId = toPositiveInteger(req.params.id);
    const submittalId = toPositiveInteger(req.params.submittalId);
    if (!projectId || !submittalId) return sendValidationError(res, 'Valid project ID and Submittal ID are required.');


    const submittal = await getProjectSubmittal(projectId, submittalId);
    if (!submittal) return sendError(res, 404, 'Submittal not found');
    if (Number(submittal.created_by) !== Number(req.user.id)) {
      return sendError(res, 403, 'You can only delete Submittals created by your account.');
    }

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
    logger.error('Error deleting project Submittal (Vendor)', { error: error.message });
    return sendError(res, 500, 'Server error deleting Submittal');
  }
};

const addProjectSubmittalVersion = async (req, res) => {
  try {
    const projectId = toPositiveInteger(req.params.id);
    const submittalId = toPositiveInteger(req.params.submittalId);
    if (!projectId || !submittalId) return sendValidationError(res, 'Valid project ID and Submittal ID are required.');


    const submittal = await getProjectSubmittal(projectId, submittalId);
    if (!submittal) return sendError(res, 404, 'Submittal not found');

    const message = String(req.body?.message || '').trim();
    const requestedStatus = req.body?.status;
    const normalizedStatus = sanitizeStatus(requestedStatus, SUBMITTAL_STATUSES, 'submitted');
    if (requestedStatus !== undefined && normalizedStatus === null) {
      return sendValidationError(res, 'Invalid Submittal status.');
    }
    if (!message && !req.file) {
      return sendValidationError(res, 'Message or attachment is required');
    }

    let storedFile = { relativePath: null, fileName: null };
    if (req.file) {
      storedFile = await persistMulterUpload({
        uploadRoot: UPLOAD_ROOT,
        relativeDirectory: `${projectId}/${submittalId}`,
        file: req.file,
      });
    }

    const versionId = await SubmittalModel.addVersion(
      submittalId,
      message || 'Version uploaded',
      normalizedStatus || 'submitted',
      storedFile.relativePath,
      storedFile.fileName,
      req.user.id
    );

    await SubmittalModel.updateSubmittal(submittalId, {
      status: normalizedStatus || 'submitted',
      ball_in_court: 'General Contractor',
    });

    const version = await SubmittalModel.getVersionById(versionId);
    return sendCreated(res, 'Version added successfully', { version });
  } catch (error) {
    logger.error('Error adding Submittal version (Vendor)', { error: error.message });
    return sendError(res, error.status || 500, error.status ? error.message : 'Server error adding version');
  }
};

const addProjectSubmittalReply = async (req, res) => {
  try {
    const projectId = toPositiveInteger(req.params.id);
    const submittalId = toPositiveInteger(req.params.submittalId);
    const versionId = toPositiveInteger(req.params.versionId);
    if (!projectId || !submittalId || !versionId) {
      return sendValidationError(res, 'Valid project ID, Submittal ID and Version ID are required.');
    }


    const submittal = await getProjectSubmittal(projectId, submittalId);
    if (!submittal) return sendError(res, 404, 'Submittal not found');

    const version = await getProjectVersion(submittalId, versionId);
    if (!version) return sendError(res, 404, 'Version not found');

    const message = String(req.body?.message || '').trim();
    if (!message) return sendValidationError(res, 'Message is required');

    const replyId = await SubmittalModel.addReply(submittalId, versionId, message, req.user.id);
    await SubmittalModel.updateSubmittal(submittalId, { status: 'responded', ball_in_court: 'General Contractor' });

    const reply = await SubmittalModel.getVersionById(replyId);
    return sendCreated(res, 'Reply added successfully', { reply });
  } catch (error) {
    logger.error('Error adding Submittal reply (Vendor)', { error: error.message });
    return sendError(res, 500, 'Server error adding reply');
  }
};

module.exports = {
  getProjectSubmittals,
  getProjectSubmittalById,
  createProjectSubmittal,
  updateProjectSubmittal,
  deleteProjectSubmittal,
  addProjectSubmittalVersion,
  addProjectSubmittalReply,
};
