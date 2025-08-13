import { Request, Response, NextFunction } from 'express';
import ContractDocumentsService from './service';
import GetContractDocumentsDto from './dto/get-contract-documents.dto';
import UploadContractDocumentDto from './dto/upload-contract-document.dto';
import DownloadContractDocumentsDto from './dto/download-contract-documents.dto';

// Multer 파일 타입 정의
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    // eslint-disable-next-line no-shadow
    interface Request {
      file?: Multer.File;
      files?: Multer.File[] | { [fieldname: string]: Multer.File[] };
    }
  }
}
// Express의 기본 Request 타입 사용 (index.d.ts에서 확장된 타입)
export default class ContractDocumentsController {
  // eslint-disable-next-line no-empty-function
  constructor(private readonly contractDocumentsService: ContractDocumentsService) {}

  // 화살표 함수를 사용하여 this 바인딩 문제 해결
  getContractDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { companyId } = req.user!;
      const query = req.query as unknown as GetContractDocumentsDto;

      const result = await this.contractDocumentsService.getContractDocuments(companyId, query);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  // ✨ 새로운 메서드: 계약서 추가용 계약 목록 조회
  getContractsForDraft = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { companyId } = req.user!;

      const result = await this.contractDocumentsService.getContractsForDraft(companyId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  uploadContractDocuments = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { companyId, id: userId } = req.user!;
      // const { contractId } = req.body as UploadContractDocumentDto;
      const file = req.file as Express.Multer.File;

      if (!file || file.size === 0) {
        res.status(400).json({ message: '업로드할 파일이 없습니다.' });
        return;
      }

      const result = await this.contractDocumentsService.uploadContractDocuments(
        companyId,
        userId,
        file,
      );

      res.status(200).json({
        message: '계약서 업로드 성공',
        contractDocumentId: result.contractDocumentId,
      });
    } catch (error) {
      next(error);
    }
  };

  downloadSingleDocument = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { companyId } = req.user!;
      const { contractDocumentId } = req.params;

      const document = await this.contractDocumentsService.getDocumentForDownload(
        companyId,
        parseInt(contractDocumentId || '0', 10),
      );

      res.setHeader('Content-Type', document.fileType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(document.fileName)}"`,
      );
      res.sendFile(document.filePath);
    } catch (error) {
      next(error);
    }
  };

  downloadMultipleDocuments = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { companyId } = req.user!;
      const { contractDocumentIds } = req.body as DownloadContractDocumentsDto;

      const zipBuffer = await this.contractDocumentsService.downloadMultipleDocuments(
        companyId,
        contractDocumentIds,
      );

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="contract-documents.zip"');
      res.send(zipBuffer);
    } catch (error) {
      next(error);
    }
  };

  // ❌ editContractDocuments 메서드 제거됨 - 이제 계약 API에서 처리

  // ✨ 새로운 메서드들: 계약 API에서 내부적으로 호출할 헬퍼 메서드들
  // 이 메서드들은 HTTP 엔드포인트가 아니라 다른 서비스에서 직접 호출하는 메서드들입니다.

  /**
   * 계약서를 계약에 연결 (계약 API 내부에서 호출)
   */
  async attachDocumentsToContract(
    companyId: number,
    contractId: number,
    documentIds: number[],
  ): Promise<void> {
    return this.contractDocumentsService.attachDocumentsToContract(
      companyId,
      contractId,
      documentIds,
    );
  }

  /**
   * 계약서 파일명 업데이트 (계약 API 내부에서 호출)
   */
  async updateContractDocumentFileNames(
    companyId: number,
    contractId: number,
    updates: { id: number; fileName?: string }[],
  ): Promise<void> {
    return this.contractDocumentsService.updateContractDocumentFileNames(
      companyId,
      contractId,
      updates,
    );
  }

  /**
   * 특정 계약의 계약서 목록 조회 (계약 API 내부에서 호출)
   */
  async getContractDocumentsByContractId(
    companyId: number,
    contractId: number,
  ): Promise<{ id: number; fileName: string }[]> {
    return this.contractDocumentsService.getContractDocumentsByContractId(companyId, contractId);
  }
}
