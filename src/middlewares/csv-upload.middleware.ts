import multer from 'multer';
import { BadRequestError } from '../common/errors/bad-request-error';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const csvFileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
  if (file.mimetype === 'text/csv') {
    return cb(null, true);
  }
  return cb(new BadRequestError('CSV 파일만 업로드할 수 있습니다.'));
};

const csvUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: csvFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

export default csvUpload;
