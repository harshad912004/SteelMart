const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');
const BidModel = require('../models/bidModel');
const ProjectGalleryModel = require('../models/projectGalleryModel');
const logger = require('../../common/utils/logger');
const { sendSuccess, sendError, sendCreated, sendValidationError } = require('../../common/utils/apiResponse');

const UPLOAD_ROOT = path.resolve(__dirname, '..', '..', 'uploads', 'gallery-files');

// ─── Extension whitelist for gallery photos (images only) ─────────────────────
const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
]);

const toPositiveInteger = (value) => {
     const numericValue = Number(value);
     return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : null;
};

const sanitizeDiskFileName = (fileName) => {
     const normalizedName = path.basename(String(fileName || '').trim());
     const extension = path.extname(normalizedName).toLowerCase();

     if (!ALLOWED_EXTENSIONS.has(extension)) {
          throw Object.assign(
               new Error(`File extension '${extension || '(none)'}' is not allowed. Only images are accepted.`),
               { status: 400 }
          );
     }

     const baseName = path.basename(normalizedName, extension).replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
     const safeBaseName = baseName || 'photo';
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
               logger.warn(`Unable to delete stored gallery file: ${error.message}`);
          }
     }
};

const getGalleries = async (req, res) => {
     try {
          const bidId = toPositiveInteger(req.params.bidId);
          if (!bidId) return sendValidationError(res, 'Valid bid id is required.');

          const bid = await BidModel.getBidById(bidId);
          if (!bid) return sendError(res, 404, 'Bid not found.');

          const galleries = await ProjectGalleryModel.getGalleriesByBidId(bidId);
          return sendSuccess(res, 'Galleries fetched successfully', { galleries });
     } catch (error) {
          logger.error(`Error fetching galleries: ${error.message}`);
          return sendError(res, 500, 'Error fetching galleries.');
     }
};

const createGallery = async (req, res) => {
     try {
          const bidId = toPositiveInteger(req.params.bidId);
          if (!bidId) return sendValidationError(res, 'Valid bid id is required.');
          
          const { title, notes, tags } = req.body;
          if (!title || !String(title).trim()) {
               return sendValidationError(res, 'Title is required.');
          }

          const bid = await BidModel.getBidById(bidId);
          if (!bid) return sendError(res, 404, 'Bid not found.');

          const galleryId = await ProjectGalleryModel.createGallery(bidId, String(title).trim(), notes ? String(notes).trim() : null);
          
          if (Array.isArray(tags)) {
               for (const tag of tags) {
                    if (String(tag).trim()) {
                         await ProjectGalleryModel.addTag(galleryId, String(tag).trim());
                    }
               }
          }

          const gallery = await ProjectGalleryModel.getGalleryById(galleryId);
          return sendCreated(res, 'Gallery created successfully', { gallery });
     } catch (error) {
          logger.error(`Error creating gallery: ${error.message}`);
          return sendError(res, 500, 'Error creating gallery.');
     }
};

const updateGallery = async (req, res) => {
     try {
          const bidId = toPositiveInteger(req.params.bidId);
          const galleryId = toPositiveInteger(req.params.galleryId);

          if (!bidId || !galleryId) return sendValidationError(res, 'Valid bid id and gallery id are required.');

          const gallery = await ProjectGalleryModel.getGalleryById(galleryId);
          if (!gallery || gallery.project_id !== bidId) return sendError(res, 404, 'Gallery not found.');

          const { title, notes } = req.body;
          
          await ProjectGalleryModel.updateGallery(
               galleryId, 
               title !== undefined ? String(title).trim() : undefined, 
               notes !== undefined ? (notes ? String(notes).trim() : null) : undefined
          );

          const updatedGallery = await ProjectGalleryModel.getGalleryById(galleryId);
          return sendSuccess(res, 'Gallery updated successfully', { gallery: updatedGallery });
     } catch (error) {
          logger.error(`Error updating gallery: ${error.message}`);
          return sendError(res, 500, 'Error updating gallery.');
     }
};

const deleteGallery = async (req, res) => {
     try {
          const bidId = toPositiveInteger(req.params.bidId);
          const galleryId = toPositiveInteger(req.params.galleryId);

          if (!bidId || !galleryId) return sendValidationError(res, 'Valid bid id and gallery id are required.');

          const gallery = await ProjectGalleryModel.getGalleryById(galleryId);
          if (!gallery || gallery.project_id !== bidId) return sendError(res, 404, 'Gallery not found.');

          await ProjectGalleryModel.deleteGallery(galleryId);

          if (gallery.photos) {
               for (const photo of gallery.photos) {
                    await removeStoredFile(photo.image_url);
               }
          }

          return sendSuccess(res, 'Gallery deleted successfully');
     } catch (error) {
          logger.error(`Error deleting gallery: ${error.message}`);
          return sendError(res, 500, 'Error deleting gallery.');
     }
};

const uploadPhoto = async (req, res) => {
     try {
          const bidId = toPositiveInteger(req.params.bidId);
          const galleryId = toPositiveInteger(req.params.galleryId);
          
          let fileName = req.headers['x-file-name'];
          if (fileName) fileName = String(fileName).trim();
          else fileName = 'photo.jpg'; 
          
          const fileBuffer = Buffer.isBuffer(req.body) ? req.body : null;

          if (!bidId || !galleryId) return sendValidationError(res, 'Valid bid id and gallery id are required.');
          if (!fileBuffer || fileBuffer.length === 0) return sendValidationError(res, 'File is required.');

          const gallery = await ProjectGalleryModel.getGalleryById(galleryId);
          if (!gallery || gallery.project_id !== bidId) return sendError(res, 404, 'Gallery not found.');

          const storedFileName = sanitizeDiskFileName(fileName);
          const storedRelativePath = path.join(String(bidId), String(galleryId), storedFileName).replace(/\\/g, '/');
          const absoluteFilePath = resolveStoredFilePath(storedRelativePath);

          await fs.mkdir(path.dirname(absoluteFilePath), { recursive: true });
          await fs.writeFile(absoluteFilePath, fileBuffer);

          try {
               const photoId = await ProjectGalleryModel.addPhoto(galleryId, storedRelativePath);
               const photo = await ProjectGalleryModel.getPhotoById(photoId);

               return sendCreated(res, 'Photo uploaded successfully', { photo });
          } catch (error) {
               await removeStoredFile(storedRelativePath);
               throw error;
          }
     } catch (error) {
          logger.error(`Error uploading gallery photo: ${error.message}`);
          return sendError(res, 500, 'Error uploading photo.');
     }
};

const updatePhoto = async (req, res) => {
     try {
          const bidId = toPositiveInteger(req.params.bidId);
          const galleryId = toPositiveInteger(req.params.galleryId);
          const photoId = toPositiveInteger(req.params.photoId);

          if (!bidId || !galleryId || !photoId) return sendValidationError(res, 'Valid bid, gallery and photo IDs are required.');

          const photo = await ProjectGalleryModel.getPhotoById(photoId);
          if (!photo || photo.project_gallery_id !== galleryId) return sendError(res, 404, 'Photo not found.');

          const { title, notes } = req.body;
          
          await ProjectGalleryModel.updatePhoto(
               photoId, 
               title !== undefined ? String(title).trim() : undefined, 
               notes !== undefined ? (notes ? String(notes).trim() : null) : undefined
          );

          const updatedPhoto = await ProjectGalleryModel.getPhotoById(photoId);
          return sendSuccess(res, 'Photo updated successfully', { photo: updatedPhoto });
     } catch (error) {
          logger.error(`Error updating gallery photo: ${error.message}`);
          return sendError(res, 500, 'Error updating photo.');
     }
};

const deletePhoto = async (req, res) => {
     try {
          const bidId = toPositiveInteger(req.params.bidId);
          const galleryId = toPositiveInteger(req.params.galleryId);
          const photoId = toPositiveInteger(req.params.photoId);

          if (!bidId || !galleryId || !photoId) return sendValidationError(res, 'Valid bid, gallery and photo IDs are required.');

          const photo = await ProjectGalleryModel.getPhotoById(photoId);
          if (!photo || photo.project_gallery_id !== galleryId) return sendError(res, 404, 'Photo not found.');

          await ProjectGalleryModel.deletePhoto(photoId);
          await removeStoredFile(photo.image_url);

          return sendSuccess(res, 'Photo deleted successfully');
     } catch (error) {
          logger.error(`Error deleting gallery photo: ${error.message}`);
          return sendError(res, 500, 'Error deleting photo.');
     }
};

const addTag = async (req, res) => {
     try {
          const bidId = toPositiveInteger(req.params.bidId);
          const galleryId = toPositiveInteger(req.params.galleryId);
          const { tag } = req.body;

          if (!bidId || !galleryId) return sendValidationError(res, 'Valid bid and gallery IDs are required.');
          if (!tag || !String(tag).trim()) return sendValidationError(res, 'Tag is required.');

          const gallery = await ProjectGalleryModel.getGalleryById(galleryId);
          if (!gallery || gallery.project_id !== bidId) return sendError(res, 404, 'Gallery not found.');

          await ProjectGalleryModel.addTag(galleryId, String(tag).trim());

          return sendCreated(res, 'Tag added successfully');
     } catch (error) {
          logger.error(`Error adding gallery tag: ${error.message}`);
          return sendError(res, 500, 'Error adding tag.');
     }
};

const deleteTag = async (req, res) => {
     try {
          const bidId = toPositiveInteger(req.params.bidId);
          const galleryId = toPositiveInteger(req.params.galleryId);
          const tag = req.params.tag;

          if (!bidId || !galleryId || !tag) return sendValidationError(res, 'Valid bid, gallery and tag are required.');

          const gallery = await ProjectGalleryModel.getGalleryById(galleryId);
          if (!gallery || gallery.project_id !== bidId) return sendError(res, 404, 'Gallery not found.');

          await ProjectGalleryModel.deleteTag(galleryId, tag);

          return sendSuccess(res, 'Tag deleted successfully');
     } catch (error) {
          logger.error(`Error deleting gallery tag: ${error.message}`);
          return sendError(res, 500, 'Error deleting tag.');
     }
};

module.exports = {
     getGalleries,
     createGallery,
     updateGallery,
     deleteGallery,
     uploadPhoto,
     updatePhoto,
     deletePhoto,
     addTag,
     deleteTag
};
