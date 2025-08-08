import { Router } from 'express';
import { firebaseImageUploadMiddleware } from '../middlewares/image-upload.middleware';
import UploadController from './controller';

const uploadRouter = Router();
const uploadController = new UploadController();

uploadRouter.post(
  '/upload',
  firebaseImageUploadMiddleware.single('file'),
  uploadController.uploadImage,
);

export default uploadRouter;
