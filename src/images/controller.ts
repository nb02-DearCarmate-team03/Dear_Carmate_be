import { Request, Response, NextFunction } from 'express';
import UploadService from './service';

export default class UploadController {
  private readonly uploadService = new UploadService();

  uploadImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { folder } = req.body as { folder?: string };
      const { imageUrl, filename } = await this.uploadService.uploadImage(
        req.file as Express.Multer.File,
        folder,
      );

      res.status(200).json({
        imageUrl,
        filename,
        size: req.file?.size,
        mimeType: req.file?.mimetype,
      });
    } catch (error) {
      next(error);
    }
  };
}
