import { Request, Response, NextFunction } from 'express';
import UploadService from './service';

export default class UploadController {
  constructor(private readonly uploadService: UploadService) {
    // UploadService는 생성자 주입을 통해 전달받습니다.
  }

  /**
   * CSV 대용량 업로드 등록
   * @route POST /uploads
   */
  async createUpload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        file,
        body: { uploadType },
        user,
      } = req;

      const { id: userId, companyId } = user ?? {};

      if (!userId || !companyId) {
        res.status(401).json({ message: '인증된 사용자만 업로드할 수 있습니다.' });
        return;
      }

      if (!file) {
        res.status(400).json({ message: 'CSV 파일이 누락되었습니다.' });
        return;
      }

      if (!uploadType || !['CAR', 'CUSTOMER'].includes(uploadType)) {
        res.status(400).json({ message: 'uploadType은 CAR 또는 CUSTOMER여야 합니다.' });
        return;
      }

      const uploadId = await this.uploadService.createUpload({
        companyId,
        userId,
        fileName: file.originalname,
        fileType: uploadType,
        status: 'PENDING',
        totalRecords: 0,
        processedRecords: 0,
        successRecords: 0,
        failedRecords: 0,
      });

      res.status(201).json({ message: '업로드가 등록되었습니다.', uploadId });
    } catch (error) {
      next(error);
    }
  }
}
