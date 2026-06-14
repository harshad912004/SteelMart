const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.doc', '.docx', '.xls', '.xlsx',
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
  '.txt', '.csv',
]);

const sanitizeDiskFileName = (fileName) => {
  const normalizedName = path.basename(String(fileName || '').trim());
  const extension = path.extname(normalizedName).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw Object.assign(
      new Error(`File extension '${extension || '(none)'}' is not allowed.`),
      { status: 400 }
    );
  }

  const baseName = path
    .basename(normalizedName, extension)
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const safeBaseName = baseName || 'file';
  return `${Date.now()}-${safeBaseName}-${crypto.randomUUID()}${extension}`;
};

const resolveStoredFilePath = (uploadRoot, relativeFilePath) => {
  const normalizedRelativePath = String(relativeFilePath || '').replace(/\//g, path.sep);
  const absolutePath = path.resolve(uploadRoot, normalizedRelativePath);
  if (!absolutePath.startsWith(uploadRoot)) {
    throw new Error('Invalid file path.');
  }
  return absolutePath;
};

const removeStoredFile = async (uploadRoot, relativeFilePath) => {
  if (!relativeFilePath) return;
  const filePath = resolveStoredFilePath(uploadRoot, relativeFilePath);
  await fs.unlink(filePath);
};

const persistBufferUpload = async ({ uploadRoot, relativeDirectory = '', originalFileName, buffer }) => {
  const safeDiskFileName = sanitizeDiskFileName(originalFileName);
  const normalizedDirectory = String(relativeDirectory || '').replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  const relativePath = normalizedDirectory ? `${normalizedDirectory}/${safeDiskFileName}` : safeDiskFileName;
  const absolutePath = path.join(uploadRoot, ...relativePath.split('/'));

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, buffer);

  return {
    fileName: originalFileName,
    relativePath,
  };
};

const persistMulterUpload = async ({ uploadRoot, relativeDirectory = '', file }) => {
  if (!file) return { fileName: null, relativePath: null };

  const safeDiskFileName = sanitizeDiskFileName(file.originalname);
  const normalizedDirectory = String(relativeDirectory || '').replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  const relativePath = normalizedDirectory ? `${normalizedDirectory}/${safeDiskFileName}` : safeDiskFileName;
  const absolutePath = path.join(uploadRoot, ...relativePath.split('/'));

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.rename(file.path, absolutePath);

  return {
    fileName: file.originalname,
    relativePath,
  };
};

module.exports = {
  ALLOWED_EXTENSIONS,
  sanitizeDiskFileName,
  resolveStoredFilePath,
  removeStoredFile,
  persistBufferUpload,
  persistMulterUpload,
};
