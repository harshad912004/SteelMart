const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ─── Allowed file types whitelist ────────────────────────────────────────────
// Maps permitted MIME types to their expected file extensions.
// A file is only accepted when BOTH its MIME type AND its extension appear here.
const ALLOWED_MIME_TYPES = {
  'application/pdf':                                              ['.pdf'],
  'application/msword':                                          ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel':                                    ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'image/jpeg':                                                  ['.jpg', '.jpeg'],
  'image/png':                                                   ['.png'],
  'image/gif':                                                   ['.gif'],
  'image/webp':                                                  ['.webp'],
  'image/svg+xml':                                               ['.svg'],
  'text/plain':                                                  ['.txt'],
  'text/csv':                                                    ['.csv'],
};

/**
 * Multer fileFilter — rejects uploads whose MIME type or extension is not
 * explicitly whitelisted. Prevents upload of executable files (.php, .exe,
 * .js, .sh, etc.) even if the client sends a spoofed Content-Type header.
 */
const fileFilter = (req, file, cb) => {
  const mimeType = file.mimetype;
  const ext = path.extname(file.originalname).toLowerCase();

  const allowedExtensions = ALLOWED_MIME_TYPES[mimeType];

  if (!allowedExtensions) {
    return cb(
      Object.assign(new Error(`File type not allowed: ${mimeType}`), { status: 400 }),
      false
    );
  }

  if (!allowedExtensions.includes(ext)) {
    return cb(
      Object.assign(
        new Error(`File extension '${ext}' does not match MIME type '${mimeType}'`),
        { status: 400 }
      ),
      false
    );
  }

  return cb(null, true);
};

// ─────────────────────────────────────────────────────────────────────────────

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const safeBase = path.basename(file.originalname, path.extname(file.originalname))
          .replace(/[^a-zA-Z0-9_-]/g, '_');
        cb(null, `${Date.now()}-${safeBase}${ext}`);
    }
});

const upload = multer({ storage, fileFilter });

module.exports = upload;
module.exports.ALLOWED_MIME_TYPES = ALLOWED_MIME_TYPES;

