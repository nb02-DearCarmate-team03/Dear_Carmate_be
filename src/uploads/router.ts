import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import UploadController from './controller';
import UploadService from './service';
import UploadRepository from './repository';
import { CsvUploadCreateDto } from './dto/csv-upload-create.dto';
import validateDto from '../common/utils/validate.dto';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { csvUploadMiddleware } from '../middlewares/csv-upload.middleware';

const uploadRouter = (prisma: PrismaClient): Router => {
  const router = Router();

  const uploadRepository = new UploadRepository(prisma);
  const uploadService = new UploadService(uploadRepository);
  const uploadController = new UploadController(uploadService);

  /**
   * @route POST /uploads
   * @desc  CSV 파일 업로드 및 데이터 처리 (고객 or 차량)
   * @access Private
   */
  router.post(
    '/',
    authenticateJWT,
    csvUploadMiddleware.single('file'),
    validateDto(CsvUploadCreateDto),
    uploadController.createAndProcessUpload,
  );

  /**
   * @route GET /uploads/:id
   * @desc  업로드 단건 조회
   * @access Private
   */
  router.get('/:id', authenticateJWT, uploadController.getUploadById);

  /**
   * @route GET /uploads
   * @desc  업로드 목록 조회 (type, page, pageSize 쿼리 지원)
   * @access Private
   */
  router.get('/', authenticateJWT, uploadController.getUploads);

  return router;
};

export default uploadRouter;
