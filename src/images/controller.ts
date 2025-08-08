import { Request, Response, NextFunction } from 'express';
import UploadService from './service';

export default class UploadController {
  private uploadService: UploadService;

  constructor() {
    this.uploadService = new UploadService();
  }

  uploadImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const imageUrl = await this.uploadService.uploadImage(req.file as Express.Multer.File);
      res.status(200).json({ imageUrl });
    } catch (error) {
      next(error);
    }
  };
}
