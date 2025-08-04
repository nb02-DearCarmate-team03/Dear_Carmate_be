import multer from 'multer';
import path from 'path';
import fs from 'fs';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.hwp'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { contractId } = req.params;

    if (!contractId) {
      return cb(new Error('contractId가 없습니다.'), '');
    }

    const uploadPath = path.join(__dirname, '../../uploads/contracts', contractId);
    fs.mkdirSync(uploadPath, { recursive: true });
    return cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const timestamp = Date.now();
    cb(null, `${base}-${timestamp}${ext}`);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error(`허용되지 않는 파일 형식입니다: ${ext}`));
  }

  return cb(null, true);
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5,
  },
});
