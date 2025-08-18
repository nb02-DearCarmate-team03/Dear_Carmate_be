import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { isAuthenticated } from '../middlewares/passport.middlewares';
import validateDto from '../common/utils/validate.dto';
import upload from '../middlewares/upload.middleware';

import ContractDocumentsRepository from './repository';
import ContractDocumentsService from './service';
import ContractDocumentsController from './controller';

import GetContractDocumentsDto from './dto/get-contract-documents.dto';
import UploadContractDocumentDto from './dto/upload-contract-document.dto';
import DownloadContractDocumentsDto from './dto/download-contract-documents.dto';
import EditContractDocumentsDto from './dto/edit-contract-documents.dto';

/** 타입 문제로 미들웨어 import 에러가 났던 지점 → 파일 안에서 간단히 정의 */
const normalizeContractIdInBody = (req: any, _res: any, next: any) => {
  const toNum = (v: unknown): number | undefined => {
    if (v == null) return undefined;
    const n = Number(v as any);
    return Number.isFinite(n) ? n : undefined;
  };

  const body = (req.body ?? {}) as Record<string, unknown>;
  const params = (req.params ?? {}) as Record<string, unknown>;
  const query = (req.query ?? {}) as Record<string, unknown>;

  // 자주 오는 모든 키 수집
  const candidates: unknown[] = [
    body.contractId,
    body.selectedContractId,
    body.selectedDealId,
    body.dealId,
    body.deal_id,
    body.contract_id,
    body.contract,
    body.id,
    query.contractId,
    query.id,
    params.contractId,
    req.header?.('x-contract-id'),
  ];

  for (let i = 0; i < candidates.length; i += 1) {
    const n = toNum(candidates[i]);
    if (typeof n === 'number') {
      (req.body as any).contractId = n;
      break;
    }
  }

  // 문자열에서 [차량번호]나 숫자만 있는 값으로 역추정
  if (typeof (req.body as any).contractId !== 'number') {
    const strings: string[] = [];
    Object.values(body).forEach((v) => {
      if (typeof v === 'string') strings.push(v);
    });
    const numFromText = strings
      .flatMap((s) => s.match(/\d+/g) ?? [])
      .map((t) => Number(t))
      .find((n) => Number.isInteger(n));
    if (Number.isInteger(numFromText)) (req.body as any).contractId = numFromText;
  }

  next();
};

const stripUnknownFormKeys = (req: any, _res: any, next: any) => {
  const allow = new Set([
    'contractId',
    'files',
    'file',
    'documents',
    'files[]',
    'file[]',
    'documents[]',
    'deleteDocumentIds',
    'deletedDocumentIds',
    'deleteIds',
    'ids',
    'documentIds',
    'deleteDocumentIds[]',
  ]);
  if (req.body && typeof req.body === 'object') {
    const keys = Object.keys(req.body);
    for (let i = 0; i < keys.length; i += 1) {
      const k = keys[i]!;
      if (!allow.has(k)) delete (req.body as any)[k];
    }
  }
  next();
};

const debugPrintForm = (req: any, _res: any, next: any) => {
  const body = req.body ?? {};
  const files = Array.isArray(req.files)
    ? req.files.map((f: any) => ({
        field: f.fieldname,
        name: f.originalname,
        size: f.size,
        path: f.path,
      }))
    : req.files;
  console.log('[CDOC] url=', req.originalUrl);
  console.log('[CDOC] bodyKeys=', Object.keys(body));
  console.log('[CDOC] body.contractId=', body.contractId);
  console.log('[CDOC] files=', files);
  next();
};

const createContractDocumentsRouter = (prisma: PrismaClient) => {
  const router = Router();

  const repository = new ContractDocumentsRepository(prisma);
  const service = new ContractDocumentsService(repository);
  const controller = new ContractDocumentsController(service);

  // 목록(문서수/담당자 포함)
  router.get(
    '/',
    isAuthenticated,
    validateDto(GetContractDocumentsDto),
    controller.getContractDocuments,
  );

  // 드롭박스: 보드에 보이는 상태(가격협의/계약서작성중)만
  router.get('/draft', isAuthenticated, controller.getDraftContractsForDropdown);

  // 업로드(바디 기반) — ❗ 경로는 반드시 '/contractDocuments/upload'
  router.post(
    '/upload',
    isAuthenticated,
    upload.any(),
    debugPrintForm,
    normalizeContractIdInBody,
    stripUnknownFormKeys,
    validateDto(UploadContractDocumentDto),
    controller.uploadContractDocuments,
  );

  // 업로드(경로 파라미터 기반)
  router.post(
    '/:contractId',
    isAuthenticated,
    upload.any(),
    debugPrintForm,
    normalizeContractIdInBody,
    validateDto(UploadContractDocumentDto),
    controller.uploadContractDocuments,
  );

  // 수정(추가/삭제)
  router.patch(
    '/:contractId',
    isAuthenticated,
    upload.any(),
    debugPrintForm,
    validateDto(EditContractDocumentsDto),
    controller.editContractDocuments,
  );

  // 단일 다운로드
  router.get('/:contractDocumentId/download', isAuthenticated, controller.downloadSingleDocument);

  // 다중 다운로드
  router.post(
    '/download',
    isAuthenticated,
    validateDto(DownloadContractDocumentsDto),
    controller.downloadMultipleDocuments,
  );

  return router;
};

export default createContractDocumentsRouter;
