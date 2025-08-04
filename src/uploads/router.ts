import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import UploadRepository from './repository';
import UploadService from './service';
import UploadController from './controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { csvUploadMiddleware } from '../middlewares/csv-upload.middleware';

const createCsvUploadRouter = (prisma: PrismaClient): Router => {
  const router = Router();

  const uploadRepository = new UploadRepository(prisma);
  const uploadService = new UploadService(uploadRepository);
  const uploadController = new UploadController(uploadService);

  /**
   * @route POST /uploads
   * @desc CSV 업로드 등록
   */
  router.post(
    '/',
    authenticateJWT,
    csvUploadMiddleware.single('file'), // multipart/form-data의 key는 "file"
    uploadController.createUpload,
  );

  return router;
};

export default createCsvUploadRouter;
