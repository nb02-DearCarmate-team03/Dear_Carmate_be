import { Request, Response, NextFunction } from 'express';
import { User } from '@prisma/client'; // Passport에서 사용하는 User 타입
import ContractDocumentsService from './service';
import GetContractDocumentsDto from './dto/get-contract-documents.dto';
import UploadContractDocumentDto from './dto/upload-contract-document.dto';
import DownloadContractDocumentsDto from './dto/download-contract-documents.dto';
import EditContractDocumentsDto from './dto/edit-contract-documents.dto';

// Passport 인증 후 Request 타입 정의
interface AuthenticatedRequest extends Request {
  user?: User;
}

export default class ContractDocumentsController {
  // eslint-disable-next-line no-empty-function
  constructor(private readonly contractDocumentsService: ContractDocumentsService) {}

  // 화살표 함수를 사용하여 this 바인딩 문제 해결
  getContractDocuments = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { companyId } = req.user!;
      const query = req.query as unknown as GetContractDocumentsDto;

      const result = await this.contractDocumentsService.getContractDocuments(companyId, query);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  uploadContractDocuments = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { companyId, id: userId } = req.user!;
      const { contractId } = req.body as UploadContractDocumentDto;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({ message: '업로드할 파일이 없습니다.' });
        return;
      }

      const result = await this.contractDocumentsService.uploadContractDocuments(
        companyId,
        userId,
        contractId,
        files,
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
    req: AuthenticatedRequest,
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
    req: AuthenticatedRequest,
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

  editContractDocuments = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { companyId, id: userId } = req.user!;
      const { contractId } = req.params;
      const { deleteDocumentIds } = req.body as EditContractDocumentsDto;
      const files = req.files as Express.Multer.File[] | undefined;

      await this.contractDocumentsService.editContractDocuments(
        companyId,
        userId,
        parseInt(contractId || '0', 10),
        deleteDocumentIds,
        files,
      );

      res.status(200).json({ message: '계약서 수정 성공' });
    } catch (error) {
      next(error);
    }
  };
}
