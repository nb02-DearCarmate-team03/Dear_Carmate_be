import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { BadRequestError } from '../common/errors/bad-request-error';

// 업로드 디렉토리 경로
const uploadDir = path.join(process.cwd(), 'uploads', 'contracts');

// 파일 저장 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 비동기 mkdir을 then/catch로 처리 (multer는 async 함수를 destination에 허용하지 않음)
    fs.promises
      .mkdir(uploadDir, { recursive: true })
      .then(() => cb(null, uploadDir))
      .catch((err) => cb(err as Error, uploadDir));
  },
  filename: (req, file, cb) => {
    try {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      cb(null, `${name}-${uniqueSuffix}${ext}`);
    } catch (err) {
      cb(err as Error, file.originalname);
    }
  },
});

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
