import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { isAuthenticated } from '../middlewares/passport.middlewares';
import validateDto from '../common/utils/validate.dto';
import upload from '../middlewares/upload.middleware';
import ContractDocumentsController from './controller';
import ContractDocumentsService from './service';
import ContractDocumentsRepository from './repository';
import GetContractDocumentsDto from './dto/get-contract-documents.dto';
import UploadContractDocumentDto from './dto/upload-contract-document.dto';
import DownloadContractDocumentsDto from './dto/download-contract-documents.dto';
import EditContractDocumentsDto from './dto/edit-contract-documents.dto';

const createContractDocumentsRouter = (prisma: PrismaClient) => {
  const router = Router();

  // 의존성 주입
  const contractDocumentsRepository = new ContractDocumentsRepository(prisma);
  const contractDocumentsService = new ContractDocumentsService(contractDocumentsRepository);
  const contractDocumentsController = new ContractDocumentsController(contractDocumentsService);

  // 계약서 목록 조회
  router.get(
    '/',
    isAuthenticated,
    validateDto(GetContractDocumentsDto),
    contractDocumentsController.getContractDocuments,
  );

  // 계약서 업로드
  router.post(
    '/upload',
    isAuthenticated,
    upload.array('files', 10), // 최대 10개 파일
    validateDto(UploadContractDocumentDto),
    contractDocumentsController.uploadContractDocuments,
  );

  // 계약서 다운로드
  router.get(
    '/:contractDocumentId/download',
    isAuthenticated,
    contractDocumentsController.downloadSingleDocument,
  );

  // 여러 계약서 다운로드
  router.post(
    '/download',
    isAuthenticated,
    validateDto(DownloadContractDocumentsDto),
    contractDocumentsController.downloadMultipleDocuments,
  );

  // 계약서 수정 (추가/삭제)
  router.patch(
    '/:contractId',
    isAuthenticated,
    upload.array('files', 10),
    validateDto(EditContractDocumentsDto),
    contractDocumentsController.editContractDocuments,
  );

  return router;
};

export default createContractDocumentsRouter;
