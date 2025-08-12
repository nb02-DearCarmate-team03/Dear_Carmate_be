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

const createContractDocumentsRouter = (prisma: PrismaClient) => {
  const router = Router();

  // 의존성 주입
  const contractDocumentsRepository = new ContractDocumentsRepository(prisma);
  const contractDocumentsService = new ContractDocumentsService(contractDocumentsRepository);
  const contractDocumentsController = new ContractDocumentsController(contractDocumentsService);

  /**
   * @swagger
   * /contractDocuments:
   *   get:
   *     tags:
   *       - ContractDocuments
   *     summary: 계약서 목록 조회
   *     description: 등록된 계약서 목록 조회
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: 페이지 번호
   *       - in: query
   *         name: pageSize
   *         schema:
   *           type: integer
   *           default: 8
   *         description: 페이지당 아이템 수
   *       - in: query
   *         name: searchBy
   *         schema:
   *           type: string
   *           enum: [contractName, userName]
   *         description: 검색 기준
   *       - in: query
   *         name: keyword
   *         schema:
   *           type: string
   *         description: 검색 키워드
   *     responses:
   *       200:
   *         description: 계약서 목록 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 currentPage:
   *                   type: integer
   *                 totalPages:
   *                   type: integer
   *                 totalItemCount:
   *                   type: integer
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: integer
   *                       contractName:
   *                         type: string
   *                       resolutionDate:
   *                         type: string
   *                         format: date
   *                       documentsCount:
   *                         type: integer
   *                       manager:
   *                         type: string
   *                       carNumber:
   *                         type: string
   *                       documents:
   *                         type: array
   *                         items:
   *                           type: object
   *                           properties:
   *                             id:
   *                               type: integer
   *                             fileName:
   *                               type: string
   *       401:
   *         description: 인증이 필요합니다
   */

  // 계약서 목록 조회
  router.get(
    '/',
    isAuthenticated,
    validateDto(GetContractDocumentsDto),
    contractDocumentsController.getContractDocuments,
  );

  /**
   * @swagger
   * /contractDocuments/upload:
   *   post:
   *     tags:
   *       - ContractDocuments
   *     summary: 계약서 업로드
   *     description: 계약서 파일 업로드 (최대 10개, 각 파일 최대 10MB)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - contractId
   *               - files
   *             properties:
   *               contractId:
   *                 type: integer
   *                 description: 계약 ID
   *                 example: 1
   *               files:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: binary
   *                 maxItems: 10
   *                 description: 업로드할 파일들 (최대 10개, 각 10MB)
   *     responses:
   *       200:
   *         description: 계약서 업로드 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "계약서 업로드 성공"
   *                 contractDocumentId:
   *                   type: integer
   *       400:
   *         description: 잘못된 요청
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "파일이 없습니다"
   *       401:
   *         description: 인증이 필요합니다
   */

  // 계약서 업로드
  router.post(
    '/upload',
    isAuthenticated,
    upload.array('files', 10), // 최대 10개 파일
    validateDto(UploadContractDocumentDto),
    contractDocumentsController.uploadContractDocuments,
  );

  /**
   * @swagger
   * /contractDocuments/{contractDocumentId}/download:
   *   get:
   *     tags:
   *       - ContractDocuments
   *     summary: 계약서 다운로드
   *     description: 단일 계약서 파일 다운로드
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: contractDocumentId
   *         required: true
   *         schema:
   *           type: integer
   *         description: 다운로드할 계약서 ID
   *     responses:
   *       200:
   *         description: 계약서 다운로드 성공
   *         content:
   *           application/octet-stream:
   *             schema:
   *               type: string
   *               format: binary
   *       401:
   *         description: 인증이 필요합니다
   *       404:
   *         description: 계약서를 찾을 수 없습니다
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "계약서를 찾을 수 없습니다"
   */

  // 계약서 다운로드
  router.get(
    '/:contractDocumentId/download',
    isAuthenticated,
    contractDocumentsController.downloadSingleDocument,
  );

  /**
   * @swagger
   * /contractDocuments/download:
   *   post:
   *     tags:
   *       - ContractDocuments
   *     summary: 계약서 다중 다운로드
   *     description: 여러 계약서를 ZIP 파일로 다운로드
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - contractDocumentIds
   *             properties:
   *               contractDocumentIds:
   *                 type: array
   *                 items:
   *                   type: integer
   *                 description: 다운로드할 계약서 ID 목록
   *                 example: [1, 2, 3]
   *     responses:
   *       200:
   *         description: 계약서 다운로드 성공
   *         content:
   *           application/zip:
   *             schema:
   *               type: string
   *               format: binary
   *       400:
   *         description: 잘못된 요청
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "계약서 ID 목록이 필요합니다"
   *       401:
   *         description: 인증이 필요합니다
   *       404:
   *         description: 계약서를 찾을 수 없습니다
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "일부 계약서를 찾을 수 없습니다"
   */

  // 여러 계약서 다운로드
  router.post(
    '/download',
    isAuthenticated,
    validateDto(DownloadContractDocumentsDto),
    contractDocumentsController.downloadMultipleDocuments,
  );

  return router;
};

export default createContractDocumentsRouter;
