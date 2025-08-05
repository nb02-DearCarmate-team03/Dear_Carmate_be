import { Request, Response, NextFunction } from 'express';
import UploadService from './service';
import { CsvUploadCreateDto } from './dto/csv-upload-create.dto';

export default class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * 업로드 + 처리 (CSV 파싱 등)
   */
  createAndProcessUpload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto: CsvUploadCreateDto = {
        ...req.body,
        companyId: req.user?.companyId as number,
      };

      const uploadId = await this.uploadService.createUpload(dto);
      await this.uploadService.processUpload(uploadId);

      res.status(201).json({ uploadId, message: '업로드 및 처리 완료' });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 업로드 단건 조회
   */
  getUploadById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const uploadId = Number(req.params.id);
      const upload = await this.uploadService.getUploadById(uploadId);

      res.json(upload);
    } catch (error) {
      next(error);
    }
  };

  /**
   * 업로드 목록 조회 (type, pagination 포함)
   */
  getUploads = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user?.companyId as number;
      const { type, page, pageSize } = req.query;

      const result = await this.uploadService.getUploads({
        companyId,
        type: type as string,
        page: Number(page),
        pageSize: Number(pageSize),
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
