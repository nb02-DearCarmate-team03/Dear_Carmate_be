/* eslint-disable */
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { isAuthenticated } from '../middlewares/passport.middlewares';
import validateDto from '../common/utils/validate.dto';
import upload from '../middlewares/upload.middleware';

import ContractDocumentsRepository from './repository';
import ContractDocumentsService from './service';
import ContractDocumentsController from './controller';

import GetContractDocumentsDto from './dto/get-contract-documents.dto';
import EditContractDocumentsDto from './dto/edit-contract-documents.dto';

/**
 * 계약서 라우터 팩토리
 */
const createContractDocumentsRouter = (prisma: PrismaClient) => {
  const router = Router();

  // DI
  const repo = new ContractDocumentsRepository(prisma);
  const svc = new ContractDocumentsService(repo);
  const ctl = new ContractDocumentsController(svc);

  /**
   * @swagger
   * tags:
   *   name: ContractDocuments
   *   description: 계약서 업로드/조회/다운로드/수정 API
   */

  /**
   * @swagger
   * /contractDocuments:
   *   get:
   *     tags: [ContractDocuments]
   *     summary: 계약서 목록 조회(페이지네이션)
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1, minimum: 1 }
   *       - in: query
   *         name: pageSize
   *         schema: { type: integer, default: 8, minimum: 1, maximum: 100 }
   *       - in: query
   *         name: searchBy
   *         schema:
   *           type: string
   *           enum: [contractName, userName, carNumber]
   *         description: 검색 기준(계약명/담당자/차량번호)
   *       - in: query
   *         name: keyword
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 currentPage: { type: integer }
   *                 totalPages: { type: integer }
   *                 totalItemCount: { type: integer }
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id: { type: integer, description: 계약 ID }
   *                       contractName: { type: string }
   *                       resolutionDate: { type: string, description: 'YYYY-MM-DD' }
   *                       documentsCount: { type: integer }
   *                       manager: { type: string }
   *                       carNumber: { type: string }
   *                       documents:
   *                         type: array
   *                         items:
   *                           type: object
   *                           properties:
   *                             id: { type: integer, description: 문서 ID }
   *                             fileName: { type: string, description: 목록/모달 표시명 }
   */
  router.get(
    '/',
    isAuthenticated,
    validateDto(GetContractDocumentsDto),
    ctl.getContractDocuments,
  );

  /**
   * @swagger
   * /contractDocuments/draft:
   *   get:
   *     tags: [ContractDocuments]
   *     summary: 업로드 대상 드래프트 계약(드롭다운)
   *     description: "{ id, name } 형태"
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200:
   *         description: 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id: { type: integer }
   *                   name: { type: string, example: "[39가7412] 홍길동 소나타" }
   */
  router.get('/draft', isAuthenticated, ctl.getDraftContracts);

  /**
   * @swagger
   * /contractDocuments/draft/dropdown:
   *   get:
   *     tags: [ContractDocuments]
   *     summary: 업로드 대상 드래프트 계약(다른 프론트 스펙)
   *     description: "{ id, data } 형태"
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200:
   *         description: 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id: { type: integer }
   *                   data: { type: string, example: "[39가7412] 홍길동 소나타" }
   */
  router.get('/draft/dropdown', isAuthenticated, ctl.getDraftContractsForDropdown);

  /**
   * @swagger
   * /contractDocuments/upload:
   *   post:
   *     tags: [ContractDocuments]
   *     summary: 계약서 업로드
   *     description: |
   *       - 프론트가 form-data로 파일을 보냅니다.
   *       - `contractId`는 params/body/query/대체키(selectedContractId, dealId 등) 어느 쪽이든 허용합니다.
   *       - `files` 필드명이 아니어도 됩니다(서버는 multer.any()로 어떤 필드명이 와도 수집).
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               contractId:
   *                 type: integer
   *                 description: 계약 ID(없으면 서버가 단 1건인 드래프트를 자동 선택)
   *               files:
   *                 type: array
   *                 items: { type: string, format: binary }
   *                 description: 업로드 파일(최대 10개, 각 10MB)
   *     responses:
   *       201:
   *         description: 업로드 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message: { type: string }
   *                 contractDocumentId: { type: integer }
   *       400:
   *         description: 잘못된 요청(파일 없음, 계약 ID 부재 등)
   */
  router.post('/upload', isAuthenticated, upload.any(), ctl.uploadContractDocuments);

  /**
   * @swagger
   * /contractDocuments/{contractId}/upload:
   *   post:
   *     tags: [ContractDocuments]
   *     summary: 계약서 업로드(경로 파라미터로 계약 ID 전달)
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: contractId
   *         required: true
   *         schema: { type: integer }
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               files:
   *                 type: array
   *                 items: { type: string, format: binary }
   *     responses:
   *       201:
   *         description: 업로드 성공
   */
  router.post('/:contractId/upload', isAuthenticated, upload.any(), ctl.uploadContractDocuments);

  /**
   * @swagger
   * /contractDocuments/{contractDocumentId}/download:
   *   get:
   *     tags: [ContractDocuments]
   *     summary: 단일 문서 다운로드
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: contractDocumentId
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       200:
   *         description: 파일 스트림
   *         content:
   *           application/octet-stream:
   *             schema: { type: string, format: binary }
   *       404:
   *         description: 문서를 찾을 수 없음
   */
  router.get('/:contractDocumentId/download', isAuthenticated, ctl.downloadSingleDocument);

  /**
   * @swagger
   * /contractDocuments/download:
   *   post:
   *     tags: [ContractDocuments]
   *     summary: 다중 문서 ZIP 다운로드
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [contractDocumentIds]
   *             properties:
   *               contractDocumentIds:
   *                 type: array
   *                 items: { type: integer }
   *                 example: [1,2,3]
   *     responses:
   *       200:
   *         description: zip 파일
   *         content:
   *           application/zip:
   *             schema: { type: string, format: binary }
   */
  router.post('/download', isAuthenticated, ctl.downloadMultipleDocuments);

  /**
   * @swagger
   * /contractDocuments/{contractId}:
   *   patch:
   *     tags: [ContractDocuments]
   *     summary: 계약서 수정(삭제 + 추가)
   *     description: |
   *       - 삭제: `deleteDocumentIds`에 [1,2] 또는 "1,2" 형태 허용  
   *       - 추가: multipart/form-data로 파일 업로드  
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: contractId
   *         required: true
   *         schema: { type: integer }
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               deleteDocumentIds:
   *                 oneOf:
   *                   - type: array
   *                     items: { type: integer }
   *                     example: [10, 11]
   *                   - type: string
   *                     example: "10,11"
   *               files:
   *                 type: array
   *                 items: { type: string, format: binary }
   *                 description: 추가할 파일(선택)
   *     responses:
   *       200:
   *         description: 수정 성공
   *       400:
   *         description: 잘못된 요청(계약 불일치/제한 초과 등)
   */
  router.patch(
    '/:contractId',
    isAuthenticated,
    upload.any(),
    validateDto(EditContractDocumentsDto),
    ctl.editContractDocuments,
  );

  return router;
};

export default createContractDocumentsRouter;
