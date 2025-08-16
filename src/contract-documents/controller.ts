import type { Request, Response, NextFunction } from 'express';
import ContractDocumentsService, { parseDeleteIds } from './service';

export default class ContractDocumentsController {
  private readonly service: ContractDocumentsService;

  constructor(service: ContractDocumentsService) {
    this.service = service;
  }

  getContractDocuments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = req.query as Record<string, unknown>;
      const page = Number(query.page ?? 1);
      const pageSize = Number(query.pageSize ?? 8);
      const searchBy = (query.searchBy as string | undefined) ?? undefined;
      const keyword = (query.keyword as string | undefined) ?? undefined;

      const result = await this.service.getContractDocuments({ page, pageSize, searchBy, keyword });
      res.json(result);
    } catch (error) {
      next(error as Error);
    }
  };

  getDraftContractsForDropdown = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = req.query as Record<string, unknown>;
      const keyword = (query.keyword as string | undefined) ?? undefined;
      const result = await this.service.getDraftContractsForDropdown({ keyword, boardOnly: true });
      res.json(result);
    } catch (error) {
      next(error as Error);
    }
  };

  uploadContractDocuments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = (req.files as Express.Multer.File[]) ?? [];
      const userId = Number((req.user as any)?.id ?? 0);
      const body = req.body as Record<string, unknown>;
      const params = req.params as Record<string, unknown>;
      const query = req.query as Record<string, unknown>;

      const candidates: Array<unknown> = [
        body.contractId,
        body.selectedContractId,
        body.selectedDealId,
        body.dealId,
        body.deal_id,
        body.contract_id,
        body.contract,
        body.id,
        params.contractId,
        query.contractId,
        query.id,
        req.header('x-contract-id'),
      ];

      let contractId: number | undefined;
      for (let i = 0; i < candidates.length; i += 1) {
        const numeric = Number(candidates[i] as any);
        if (Number.isFinite(numeric)) {
          contractId = numeric;
          break;
        }
      }

      if (!contractId) {
        const stringValues: string[] = [];
        const values = Object.values(body);
        for (let i = 0; i < values.length; i += 1)
          if (typeof values[i] === 'string') stringValues.push(values[i] as string);
        contractId = await this.service.resolveContractIdFromStrings(stringValues);
      }

      if (!Number.isFinite(contractId)) {
        res.status(400).json({ message: '계약 ID가 필요합니다.' });
        return;
      }
      if (!files.length) {
        res.status(400).json({ message: '업로드할 파일이 없습니다.' });
        return;
      }

      const result = await this.service.uploadContractDocuments(
        userId,
        contractId as number,
        files,
      );
      res.status(201).json(result);
    } catch (error) {
      next(error as Error);
    }
  };

  editContractDocuments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = Number((req.user as any)?.id ?? 0);
      const files = (req.files as Express.Multer.File[]) ?? [];
      const params = req.params as Record<string, unknown>;
      const body = req.body as Record<string, unknown>;

      const contractIdRaw = Number(params.contractId);
      const raw =
        body.deleteDocumentIds ??
        body.deletedDocumentIds ??
        body.deleteIds ??
        body.ids ??
        body.documentIds ??
        (body as any)['deleteDocumentIds[]'];

      const deleteIds = parseDeleteIds(raw as any);

      await this.service.editContractDocuments(
        userId,
        Number.isFinite(contractIdRaw) ? contractIdRaw : undefined,
        deleteIds,
        files,
      );
      res.status(204).end();
    } catch (error) {
      next(error as Error);
    }
  };

  downloadSingleDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = req.params as Record<string, unknown>;
      const id = Number(params.contractDocumentId ?? params.id);
      if (!Number.isFinite(id)) {
        res.status(400).json({ message: '잘못된 요청입니다' });
        return;
      }
      const file = await this.service.getDocumentForDownload(id);
      res.setHeader('Content-Type', file.fileType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
      );
      res.sendFile(file.filePath, (err) => {
        if (err) next(err);
      });
    } catch (error) {
      if ((error as any)?.name === 'NotFoundError') {
        res.status(404).json({ message: '파일을 찾을 수 없습니다.' });
        return;
      }
      next(error as Error);
    }
  };

  downloadMultipleDocuments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as Record<string, unknown>;
      const idsInput = body.ids as unknown;
      const ids: number[] = Array.isArray(idsInput)
        ? (idsInput as unknown[]).map((v) => Number(v)).filter((n) => Number.isInteger(n))
        : [];
      if (!ids.length) {
        res.status(400).json({ message: '잘못된 요청입니다' });
        return;
      }

      const { buffer, fileName } = await this.service.createZipForDocuments(ids);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.end(buffer);
    } catch (error) {
      next(error as Error);
    }
  };
}
