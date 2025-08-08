import multer, { MulterError } from 'multer';

// Firebase는 메모리 저장소를 사용해야 req.file.buffer를 사용할 수 있습니다.
export const firebaseImageUploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 최대 5MB
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      const error = new MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname);
      error.message = '이미지 파일만 업로드할 수 있습니다.';
      return cb(error); // eslint 대응을 위해 return 명시
    }
    return cb(null, true); // 성공 처리
  },
});
