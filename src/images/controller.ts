import { Request, Response, NextFunction } from 'express';
import UploadService from './service';

export default class UploadController {
  constructor(private readonly uploadService: UploadService) {
    // UploadService 인스턴스를 생성자에서 주입받습니다.
    // 이로 인해 테스트가 용이해지고, 의존성 관리가 간편해집니다.
  }

  uploadImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ message: '이미지 파일이 없습니다.' });
        return;
      }

      const { folder } = (req.body ?? {}) as { folder?: string };
      const { imageUrl, filename } = await this.uploadService.uploadImage(
        req.file as Express.Multer.File,
        folder,
      );

      res.status(200).json({
        imageUrl,
        filename,
        size: req.file.size,
        mimeType: req.file.mimetype,
      });
    } catch (error) {
      next(error);
    }
  };
}
