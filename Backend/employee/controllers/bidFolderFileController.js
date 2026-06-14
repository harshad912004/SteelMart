const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const BidFolderFileModel = require('../models/bidFolderFileModel');
const logger = require('../../common/utils/logger');
const { sendSuccess, sendError, sendCreated, sendValidationError } = require('../../common/utils/apiResponse');

const UPLOAD_ROOT = path.resolve(__dirname, '..', '..', 'uploads', 'bid-files');
const ROOT_FILES_FOLDER_NAME = BidFolderFileModel.ROOT_FILES_FOLDER_NAME;

const toPositiveInteger = (value) => {
     const numericValue = Number(value);
     return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : null;
};

const normalizeParentId = (value) => {
     if (value === undefined || value === null || value === '' || value === 'null') {
          return null;
     }

     return toPositiveInteger(value);
};

const normalizeName = (value) => String(value || '').trim();

const sanitizeDiskFileName = (fileName) => {
     const normalizedName = path.basename(String(fileName || '').trim());
     const extension = path.extname(normalizedName);
     const baseName = path.basename(normalizedName, extension).replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
     const safeBaseName = baseName || 'file';
     return `${Date.now()}-${safeBaseName}-${crypto.randomUUID()}${extension}`;
};

const resolveStoredFilePath = (relativeFilePath) => {
     const normalizedRelativePath = String(relativeFilePath || '').replace(/\//g, path.sep);
     const absolutePath = path.resolve(UPLOAD_ROOT, normalizedRelativePath);

     if (!absolutePath.startsWith(UPLOAD_ROOT)) {
          throw new Error('Invalid file path.');
     }

     return absolutePath;
};

const removeStoredFile = async (relativeFilePath) => {
     if (!relativeFilePath) {
          return;
     }

     try {
          const filePath = resolveStoredFilePath(relativeFilePath);
          await fs.unlink(filePath);
     } catch (error) {
          if (error.code !== 'ENOENT') {
               logger.warn(`Unable to delete stored bid file: ${error.message}`);
          }
     }
};

const collectDescendantFolderIds = async (folderId) => {
     const folderIds = [folderId];
     const childFolders = await BidFolderFileModel.getChildFolders(folderId);

     for (const childFolder of childFolders) {
          const childFolderIds = await collectDescendantFolderIds(childFolder.id);
          folderIds.push(...childFolderIds);
     }

     return folderIds;
};

const isReservedRootFolderName = (folderName) => folderName.toLowerCase() === ROOT_FILES_FOLDER_NAME.toLowerCase();

const getOrCreateRootFilesFolder = async (bidId) => {
     const existingFolder = await BidFolderFileModel.getRootFilesFolder(bidId);
     if (existingFolder) {
          return existingFolder;
     }

     const folderId = await BidFolderFileModel.createFolder({
          bid_id: bidId,
          parent_id: null,
          folder_name: ROOT_FILES_FOLDER_NAME
     });

     return BidFolderFileModel.getFolderById(folderId);
};

const uploadFileToFolder = async ({ bidId, folderId, folderName, fileName, fileBuffer, mimeType, userId }) => {
     const existingFile = await BidFolderFileModel.getFileByName(folderId, fileName);
     if (existingFile) {
          return { status: 409, message: 'File with this name already exists.' };
     }

     const storedFileName = sanitizeDiskFileName(fileName);
     const storedRelativePath = path.join(String(bidId), String(folderId), storedFileName).replace(/\\/g, '/');
     const absoluteFilePath = resolveStoredFilePath(storedRelativePath);

     await fs.mkdir(path.dirname(absoluteFilePath), { recursive: true });
     await fs.writeFile(absoluteFilePath, fileBuffer);

     try {
          const fileId = await BidFolderFileModel.createFile({
               folder_id: folderId,
               file_name: fileName,
               file_path: storedRelativePath,
               file_size: fileBuffer.length,
               mime_type: mimeType || 'application/octet-stream',
               created_by: userId
          });

          const createdFile = await BidFolderFileModel.getFileById(fileId);
          logger.info(`File uploaded successfully: ${fileName} (${folderName})`);
          return { file: createdFile };
     } catch (error) {
          await removeStoredFile(storedRelativePath);
          throw error;
     }
};

const createFolder = async (req, res) => {
     try {
          const bidId = toPositiveInteger(req.params.bidId);
          const folderName = normalizeName(req.body.folder_name);
          const parentId = normalizeParentId(req.body.parent_id);

          if (!bidId) {
               return sendValidationError(res, 'Valid bid id is required.');
          }

          if (!folderName) {
               return sendValidationError(res, 'Folder name is required.');
          }

          if (isReservedRootFolderName(folderName)) {
               return sendValidationError(res, 'This folder name is reserved.');
          }

          const bid = await BidFolderFileModel.getBidById(bidId);
          if (!bid) {
               return sendError(res, 404, 'Bid not found.');
          }

          if (req.body.parent_id !== undefined && parentId === null && req.body.parent_id !== null && req.body.parent_id !== '' && req.body.parent_id !== 'null') {
               return sendValidationError(res, 'Valid parent folder id is required.');
          }

          if (parentId) {
               const parentFolder = await BidFolderFileModel.getFolderByIdAndBid(bidId, parentId);
               if (!parentFolder) {
                    return sendError(res, 404, 'Parent folder not found.');
               }
          }

          const existingFolder = await BidFolderFileModel.getFolderByName(bidId, parentId, folderName);
          if (existingFolder) {
               return sendError(res, 409, 'Folder with this name already exists.');
          }

          const folderId = await BidFolderFileModel.createFolder({
               bid_id: bidId,
               parent_id: parentId,
               folder_name: folderName
          });

          const createdFolder = await BidFolderFileModel.getFolderById(folderId);
          logger.info(`Folder created successfully: ${createdFolder.folder_name}`);
          return sendCreated(res, 'Folder created successfully', { folder: createdFolder });
     } catch (error) {
          logger.error(`Error creating folder: ${error.message}`);
          return sendError(res, 500, 'Error creating folder.');
     }
};

const viewBidFolders = async (req, res) => {
     try {
          const bidId = toPositiveInteger(req.params.bidId);
          const parentId = normalizeParentId(req.query.parent_id);

          if (!bidId) {
               return sendValidationError(res, 'Valid bid id is required.');
          }

          if (req.query.parent_id !== undefined && parentId === null && req.query.parent_id !== '' && req.query.parent_id !== 'null') {
               return sendValidationError(res, 'Valid parent folder id is required.');
          }

          const bid = await BidFolderFileModel.getBidById(bidId);
          if (!bid) {
               return sendError(res, 404, 'Bid not found.');
          }

          if (parentId) {
               const parentFolder = await BidFolderFileModel.getFolderByIdAndBid(bidId, parentId);
               if (!parentFolder) {
                    return sendError(res, 404, 'Parent folder not found.');
               }
          }

          const folders = await BidFolderFileModel.getFoldersByBidAndParent(bidId, parentId);
          const folderStats = await BidFolderFileModel.getFolderStatsForFolderIds(folders.map((folder) => folder.id));
          const foldersWithStats = folders.map((folder) => ({
               ...folder,
               file_count: folderStats[folder.id]?.file_count || 0,
               total_size: folderStats[folder.id]?.total_size || 0
          }));

          return sendSuccess(res, 'Bid folders fetched successfully', {
               folders: foldersWithStats,
               parent_id: parentId
          });
     } catch (error) {
          logger.error(`Error fetching bid folders: ${error.message}`);
          return sendError(res, 500, 'Error fetching bid folders.');
     }
};

const deleteBidFolder = async (req, res) => {
     try {
          const bidId = toPositiveInteger(req.params.bidId);
          const folderId = toPositiveInteger(req.params.folderId);

          if (!bidId || !folderId) {
               return sendValidationError(res, 'Valid bid id and folder id are required.');
          }

          const bid = await BidFolderFileModel.getBidById(bidId);
          if (!bid) {
               return sendError(res, 404, 'Bid not found.');
          }

          const folder = await BidFolderFileModel.getFolderByIdAndBid(bidId, folderId);
          if (!folder) {
               return sendError(res, 404, 'Folder not found.');
          }

          if (isReservedRootFolderName(folder.folder_name)) {
               return sendError(res, 400, 'This folder cannot be deleted.');
          }

          const folderIds = await collectDescendantFolderIds(folderId);
          const files = await BidFolderFileModel.getFilesByFolderIds(folderIds);

          await BidFolderFileModel.deleteFolder(folderId);
          await Promise.all(files.map((file) => removeStoredFile(file.file_path)));

          logger.info(`Folder deleted successfully: ${folderId}`);
          return sendSuccess(res, 'Folder deleted successfully');
     } catch (error) {
          logger.error(`Error deleting folder: ${error.message}`);
          return sendError(res, 500, 'Error deleting folder.');
     }
};

const renameFolder = async (req, res) => {
     try {
          const bidId = toPositiveInteger(req.params.bidId);
          const folderId = toPositiveInteger(req.params.folderId);
          const folderName = normalizeName(req.body.folder_name);

          if (!bidId || !folderId) {
               return sendValidationError(res, 'Valid bid id and folder id are required.');
          }

          if (!folderName) {
               return sendValidationError(res, 'Folder name is required.');
          }

          if (isReservedRootFolderName(folderName)) {
               return sendValidationError(res, 'This folder name is reserved.');
          }

          const bid = await BidFolderFileModel.getBidById(bidId);
          if (!bid) {
               return sendError(res, 404, 'Bid not found.');
          }

          const folder = await BidFolderFileModel.getFolderByIdAndBid(bidId, folderId);
          if (!folder) {
               return sendError(res, 404, 'Folder not found.');
          }

          if (isReservedRootFolderName(folder.folder_name)) {
               return sendError(res, 400, 'This folder cannot be renamed.');
          }

          const existingFolder = await BidFolderFileModel.getFolderByName(bidId, folder.parent_id, folderName, folderId);
          if (existingFolder) {
               return sendError(res, 409, 'Folder with this name already exists.');
          }

          await BidFolderFileModel.renameFolder(folderId, folderName);
          const updatedFolder = await BidFolderFileModel.getFolderById(folderId);

          logger.info(`Folder renamed successfully: ${folderId}`);
          return sendSuccess(res, 'Folder renamed successfully', { folder: updatedFolder });
     } catch (error) {
          logger.error(`Error renaming folder: ${error.message}`);
          return sendError(res, 500, 'Error renaming folder.');
     }
};

const uploadFile = async (req, res) => {
     try {
          const bidId = toPositiveInteger(req.params.bidId);
          const folderId = toPositiveInteger(req.params.folderId);
          const fileName = normalizeName(req.headers['x-file-name']);
          const fileBuffer = Buffer.isBuffer(req.body) ? req.body : null;

          if (!bidId || !folderId) {
               return sendValidationError(res, 'Valid bid id and folder id are required.');
          }

          if (!fileName) {
               return sendValidationError(res, 'File name is required.');
          }

          if (!fileBuffer || fileBuffer.length === 0) {
               return sendValidationError(res, 'File is required.');
          }

          const bid = await BidFolderFileModel.getBidById(bidId);
          if (!bid) {
               return sendError(res, 404, 'Bid not found.');
          }

          const folder = await BidFolderFileModel.getFolderByIdAndBid(bidId, folderId);
          if (!folder) {
               return sendError(res, 404, 'Folder not found.');
          }

          const result = await uploadFileToFolder({
               bidId,
               folderId,
               folderName: folder.folder_name,
               fileName,
               fileBuffer,
               mimeType: normalizeName(req.headers['content-type']),
               userId: req.user.id
          });

          if (result?.message) {
               return sendError(res, result.status, result.message);
          }

          return sendCreated(res, 'File uploaded successfully', { file: result.file });
     } catch (error) {
          logger.error(`Error uploading file: ${error.message}`);
          return sendError(res, 500, 'Error uploading file.');
     }
};

const viewBidRootFiles = async (req, res) => {
     try {
          const bidId = toPositiveInteger(req.params.bidId);

          if (!bidId) {
               return sendValidationError(res, 'Valid bid id is required.');
          }

          const bid = await BidFolderFileModel.getBidById(bidId);
          if (!bid) {
               return sendError(res, 404, 'Bid not found.');
          }

          const rootFolder = await BidFolderFileModel.getRootFilesFolder(bidId);
          if (!rootFolder) {
               return sendSuccess(res, 'Bid root files fetched successfully', { files: [] });
          }

          const files = await BidFolderFileModel.getFilesByFolder(rootFolder.id);
          return sendSuccess(res, 'Bid root files fetched successfully', { files });
     } catch (error) {
          logger.error(`Error fetching bid root files: ${error.message}`);
          return sendError(res, 500, 'Error fetching bid root files.');
     }
};

const uploadRootFile = async (req, res) => {
     try {
          const bidId = toPositiveInteger(req.params.bidId);
          const fileName = normalizeName(req.headers['x-file-name']);
          const fileBuffer = Buffer.isBuffer(req.body) ? req.body : null;
          const folderPath = req.headers['x-folder-path'] ? String(req.headers['x-folder-path']).trim() : '';

          if (!bidId) {
               return sendValidationError(res, 'Valid bid id is required.');
          }

          if (!fileName) {
               return sendValidationError(res, 'File name is required.');
          }

          if (!fileBuffer || fileBuffer.length === 0) {
               return sendValidationError(res, 'File is required.');
          }

          const bid = await BidFolderFileModel.getBidById(bidId);
          if (!bid) {
               return sendError(res, 404, 'Bid not found.');
          }

          let targetFolder;
          if (folderPath) {
               const pathParts = folderPath.split('/').map(p => p.trim()).filter(Boolean);
               let currentParentId = null;

               for (const part of pathParts) {
                    if (isReservedRootFolderName(part)) {
                         return sendValidationError(res, 'Folder name is reserved.');
                    }

                    let folder = await BidFolderFileModel.getFolderByName(bidId, currentParentId, part);
                    if (!folder) {
                         const newFolderId = await BidFolderFileModel.createFolder({
                              bid_id: bidId,
                              parent_id: currentParentId,
                              folder_name: part
                         });
                         folder = await BidFolderFileModel.getFolderById(newFolderId);
                    }
                    currentParentId = folder.id;
                    targetFolder = folder;
               }
          } else {
               targetFolder = await getOrCreateRootFilesFolder(bidId);
          }

          const result = await uploadFileToFolder({
               bidId,
               folderId: targetFolder.id,
               folderName: targetFolder.folder_name,
               fileName,
               fileBuffer,
               mimeType: normalizeName(req.headers['content-type']),
               userId: req.user.id
          });

          if (result?.message) {
               return sendError(res, result.status, result.message);
          }

          return sendCreated(res, 'File uploaded successfully', { file: result.file });
     } catch (error) {
          logger.error(`Error uploading bid root file: ${error.message}`);
          return sendError(res, 500, 'Error uploading file.');
     }
};

const viewFolderFiles = async (req, res) => {
     try {
          const bidId = toPositiveInteger(req.params.bidId);
          const folderId = toPositiveInteger(req.params.folderId);

          if (!bidId || !folderId) {
               return sendValidationError(res, 'Valid bid id and folder id are required.');
          }

          const bid = await BidFolderFileModel.getBidById(bidId);
          if (!bid) {
               return sendError(res, 404, 'Bid not found.');
          }

          const folder = await BidFolderFileModel.getFolderByIdAndBid(bidId, folderId);
          if (!folder) {
               return sendError(res, 404, 'Folder not found.');
          }

          const files = await BidFolderFileModel.getFilesByFolder(folderId);
          return sendSuccess(res, 'Folder files fetched successfully', {
               folder,
               files
          });
     } catch (error) {
          logger.error(`Error fetching folder files: ${error.message}`);
          return sendError(res, 500, 'Error fetching folder files.');
     }
};

const deleteFile = async (req, res) => {
     try {
          const bidId = toPositiveInteger(req.params.bidId);
          const folderId = toPositiveInteger(req.params.folderId);
          const fileId = toPositiveInteger(req.params.fileId);

          if (!bidId || !folderId || !fileId) {
               return sendValidationError(res, 'Valid bid id, folder id and file id are required.');
          }

          const bid = await BidFolderFileModel.getBidById(bidId);
          if (!bid) {
               return sendError(res, 404, 'Bid not found.');
          }

          const folder = await BidFolderFileModel.getFolderByIdAndBid(bidId, folderId);
          if (!folder) {
               return sendError(res, 404, 'Folder not found.');
          }

          const file = await BidFolderFileModel.getFileByIdInFolder(bidId, folderId, fileId);
          if (!file) {
               return sendError(res, 404, 'File not found.');
          }

          await BidFolderFileModel.deleteFile(fileId);
          await removeStoredFile(file.file_path);

          logger.info(`File deleted successfully: ${fileId}`);
          return sendSuccess(res, 'File deleted successfully');
     } catch (error) {
          logger.error(`Error deleting file: ${error.message}`);
          return sendError(res, 500, 'Error deleting file.');
     }
};

const renameFile = async (req, res) => {
     try {
          const bidId = toPositiveInteger(req.params.bidId);
          const folderId = toPositiveInteger(req.params.folderId);
          const fileId = toPositiveInteger(req.params.fileId);
          const fileName = normalizeName(req.body.file_name);

          if (!bidId || !folderId || !fileId) {
               return sendValidationError(res, 'Valid bid id, folder id and file id are required.');
          }

          if (!fileName) {
               return sendValidationError(res, 'File name is required.');
          }

          const bid = await BidFolderFileModel.getBidById(bidId);
          if (!bid) {
               return sendError(res, 404, 'Bid not found.');
          }

          const folder = await BidFolderFileModel.getFolderByIdAndBid(bidId, folderId);
          if (!folder) {
               return sendError(res, 404, 'Folder not found.');
          }

          const file = await BidFolderFileModel.getFileByIdInFolder(bidId, folderId, fileId);
          if (!file) {
               return sendError(res, 404, 'File not found.');
          }

          const existingFile = await BidFolderFileModel.getFileByName(folderId, fileName, fileId);
          if (existingFile) {
               return sendError(res, 409, 'File with this name already exists.');
          }

          await BidFolderFileModel.renameFile(fileId, fileName);
          const updatedFile = await BidFolderFileModel.getFileById(fileId);

          logger.info(`File renamed successfully: ${fileId}`);
          return sendSuccess(res, 'File renamed successfully', { file: updatedFile });
     } catch (error) {
          logger.error(`Error renaming file: ${error.message}`);
          return sendError(res, 500, 'Error renaming file.');
     }
};

const downloadFile = async (req, res) => {
     try {
          const bidId = toPositiveInteger(req.params.bidId);
          const folderId = toPositiveInteger(req.params.folderId);
          const fileId = toPositiveInteger(req.params.fileId);

          if (!bidId || !folderId || !fileId) {
               return sendValidationError(res, 'Valid bid id, folder id and file id are required.');
          }

          const bid = await BidFolderFileModel.getBidById(bidId);
          if (!bid) {
               return sendError(res, 404, 'Bid not found.');
          }

          const folder = await BidFolderFileModel.getFolderByIdAndBid(bidId, folderId);
          if (!folder) {
               return sendError(res, 404, 'Folder not found.');
          }

          const file = await BidFolderFileModel.getFileByIdInFolder(bidId, folderId, fileId);
          if (!file) {
               return sendError(res, 404, 'File not found.');
          }

          const absoluteFilePath = resolveStoredFilePath(file.file_path);

          try {
               await fs.access(absoluteFilePath);
          } catch (error) {
               return sendError(res, 404, 'Stored file not found.');
          }

          return res.download(absoluteFilePath, file.file_name);
     } catch (error) {
          logger.error(`Error downloading file: ${error.message}`);
          return sendError(res, 500, 'Error downloading file.');
     }
};

module.exports = {
     createFolder,
     viewBidFolders,
     deleteBidFolder,
     renameFolder,
     viewBidRootFiles,
     uploadRootFile,
     uploadFile,
     viewFolderFiles,
     deleteFile,
     renameFile,
     downloadFile
};