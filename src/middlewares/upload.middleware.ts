import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { BadRequestError } from '../common/errors/bad-request-error';

// 업로드 디렉토리 경로
const uploadDir = path.join(process.cwd(), 'uploads', 'contracts');
const storage = multer.memoryStorage();

// 파일 필터
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.csv'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new BadRequestError(`허용되지 않은 파일 형식입니다: ${ext}`));
  }
};

// Multer 설정
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10, // 최대 10개
  },
});

export default upload;
