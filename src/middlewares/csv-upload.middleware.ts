import multer from 'multer';
import path from 'path';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const csvFileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== '.csv') {
    return cb(new Error('CSV 파일만 업로드할 수 있습니다.'));
  }
  return cb(null, true);
};

export const csvUploadMiddleware = multer({
  storage: multer.memoryStorage(),
  fileFilter: csvFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});
