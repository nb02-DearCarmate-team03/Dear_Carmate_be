import { Request, Response } from 'express';
import UploadService from './service';
import { CsvUploadCreateDto } from './dto/csv-upload-create.dto';

export default class UploadController {
  constructor(private readonly uploadService: UploadService) {
    // UploadService 인스턴스를 생성합니다.
  }

  // 업로드 + 처리까지 한 번에
  createAndProcessUpload = async (req: Request, res: Response) => {
    const dto: CsvUploadCreateDto = {
      ...req.body,
      companyId: req.user?.companyId as number, // JWT 인증 유저
    };

    const uploadId = await this.uploadService.createUpload(dto);
    await this.uploadService.processUpload(uploadId);

    res.status(201).json({ uploadId, message: '업로드 및 처리 완료' });
  };

  getUploadById = async (req: Request, res: Response) => {
    const uploadId = Number(req.params.id);
    const upload = await this.uploadService.getUploadById(uploadId);
    res.json(upload);
  };

  getUploads = async (req: Request, res: Response) => {
    const companyId = req.user?.companyId as number;
    const { type, page, limit } = req.query;

    const result = await this.uploadService.getUploads({
      companyId,
      type: type as string,
      page: Number(page),
      limit: Number(limit),
    });

    res.json(result);
  };
}
