/* eslint-disable */
import { Request, Response, NextFunction } from 'express';
import ContractDocumentsService from './service';
import GetContractDocumentsDto from './dto/get-contract-documents.dto';
import EditContractDocumentsDto from './dto/edit-contract-documents.dto';
import UploadContractDocumentDto from './dto/upload-contract-document.dto';

// 문자열/숫자/undefined 무엇이 와도 number로 시도, 실패하면 undefined
const toNumber = (v: unknown): number | undefined => {
  if (v == null) return undefined;
  const n = Number((v as any).toString().trim());
  return Number.isFinite(n) ? n : undefined;
};

// multer 결과를 어떤 형태(any/array/fields/single)로 받더라도 File[]로 표준화
const collectMulterFiles = (req: Request): Express.Multer.File[] => {
  const rf = req.files as unknown;

  if (Array.isArray(rf)) {
    return rf as Express.Multer.File[];
  }
  if (rf && typeof rf === 'object') {
    const acc: Express.Multer.File[] = [];
    for (const v of Object.values(rf as Record<string, unknown>)) {
      if (Array.isArray(v)) for (const it of v) if (it) acc.push(it as Express.Multer.File);
    }
    return acc;
  }
  const single = (req as any).file as Express.Multer.File | undefined;
  return single ? [single] : [];
};

export default class ContractDocumentsController {
  constructor(private readonly service: ContractDocumentsService) {}

  // 목록
  getContractDocuments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ message: '인증이 필요합니다.' });
        return;
      }
      const { companyId } = req.user;
      const dto = req.query as unknown as GetContractDocumentsDto;

      const result = await this.service.getContractDocuments(companyId, dto);
      res.status(200).json(result);
    } catch (err) {
      next(err as Error);
    }
  };

  // 드래프트(드롭다운) 목록
  getDraftContractsForDropdown = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) { res.status(401).json({ message: '인증이 필요합니다.' }); return; }
      const { companyId } = req.user;
      const rows = await this.service.getDraftContractsForDropdown(companyId);
      res.status(200).json(rows);
    } catch (err) {
      next(err as Error);
    }
  };

  // (선택) 단순 드래프트 목록
  getDraftContracts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) { res.status(401).json({ message: '인증이 필요합니다.' }); return; }
      const { companyId } = req.user;
      const rows = await this.service.getDraftContracts(companyId);
      res.status(200).json(rows);
    } catch (err) {
      next(err as Error);
    }
  };

  // 업로드
  uploadContractDocuments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ message: '인증이 필요합니다.' });
        return;
      }
      const { companyId, id: userId } = req.user;

      // 다양한 위치/키에서 contractId 수집
      const fromParam = toNumber((req.params as any)?.contractId);
      const fromBody = toNumber((req.body as Partial<UploadContractDocumentDto> | any)?.contractId);
      const fromQuery = toNumber((req.query as any)?.contractId);
      const fromAlt =
        toNumber((req.body as any)?.selectedContractId) ??
        toNumber((req.body as any)?.dealId) ??
        toNumber((req.body as any)?.deal_id) ??
        toNumber((req.body as any)?.contract_id);

      let useContractId = fromParam ?? fromBody ?? fromQuery ?? fromAlt;

      // 하나도 없으면: 진행중 드래프트가 1건일 때 자동 선택
      if (useContractId == null) {
        const auto = await this.service.resolveContractIdForUpload(companyId, userId);
        if (typeof auto === 'number' && Number.isFinite(auto)) useContractId = auto;
      }

      if (typeof useContractId !== 'number' || !Number.isFinite(useContractId) || useContractId <= 0) {
        res.status(400).json({
          message:
            '계약 ID를 찾을 수 없습니다. 진행 중인 계약이 1건일 때만 자동 선택됩니다. 계약을 선택한 뒤 업로드해주세요.',
        });
        return;
      }

      const files = collectMulterFiles(req);
      if (files.length === 0) {
        res.status(400).json({ message: '업로드할 파일이 없습니다.' });
        return;
      }

      const result = await this.service.uploadContractDocuments(companyId, userId, useContractId, files);
      res.status(201).json({ message: '계약서 업로드 성공', contractDocumentId: result.contractDocumentId });
    } catch (err) {
      next(err as Error);
    }
  };

  // 단일 다운로드
  downloadSingleDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) { res.status(401).json({ message: '인증이 필요합니다.' }); return; }
      const { companyId } = req.user;

      const contractDocumentId = toNumber((req.params as any)?.contractDocumentId);
      if (!contractDocumentId) {
        res.status(400).json({ message: '유효한 문서 ID가 아닙니다.' });
        return;
      }

      const doc = await this.service.getDocumentForDownload(companyId, contractDocumentId);

      const filename = (doc.fileName ?? 'download').trim() || 'download';
      const fallback = filename.replace(/[^\x20-\x7E]/g, '_');

      res.setHeader('Content-Type', doc.fileType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      );
      res.sendFile(doc.filePath);
    } catch (err) {
      next(err as Error);
    }
  };

  // ZIP 다중 다운로드
  downloadMultipleDocuments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) { res.status(401).json({ message: '인증이 필요합니다.' }); return; }
      const { companyId } = req.user;

      const body = req.body as { contractDocumentIds?: number[] };
      const ids = Array.isArray(body?.contractDocumentIds)
        ? body.contractDocumentIds
        : [];

      if (!ids.length) {
        res.status(400).json({ message: '다운로드할 문서를 선택해주세요.' });
        return;
      }

      const zip = await this.service.downloadMultipleDocuments(companyId, ids);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="documents.zip"');
      res.status(200).send(zip);
    } catch (err) {
      next(err as Error);
    }
  };

  // 수정(삭제/추가)
  editContractDocuments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) { res.status(401).json({ message: '인증이 필요합니다.' }); return; }
      const { companyId, id: userId } = req.user;

      const contractId = toNumber((req.params as any)?.contractId) ?? 0;
      if (!contractId) {
        res.status(400).json({ message: '유효한 계약 ID가 아닙니다.' });
        return;
      }

      // 삭제 ID는 number[]만 허용되도록 정규화
      const raw = (req.body as EditContractDocumentsDto | any)?.deleteDocumentIds;
      const rawArr: any[] = Array.isArray(raw) ? raw : raw != null ? [raw] : [];
      const deleteIds = Array.from(
        new Set(
          rawArr
            .flatMap((t) => (typeof t === 'string' ? t.split(',') : [t]))
            .map((v) => Number(String(v).trim()))
            .filter((n) => Number.isInteger(n) && n > 0),
        ),
      );

      const files = collectMulterFiles(req);

      await this.service.editContractDocuments(companyId, userId, contractId, deleteIds, files);
      res.status(200).json({ message: '계약서 수정 성공' });
    } catch (err) {
      next(err as Error);
    }
  };
}
