import { Router } from 'express';
import admin from '../common/utils/firebase-admin';
import { firebaseImageUploadMiddleware } from '../middlewares/image-upload.middleware';
import UploadController from './controller';
import UploadService from './service';
import UploadRepository from './repository';

const uploadRouter = Router();

const bucket = admin.storage().bucket();

const uploadRepository = new UploadRepository(bucket);
const uploadService = new UploadService(uploadRepository);
const uploadController = new UploadController(uploadService);

uploadRouter.post(
  '/upload',
  firebaseImageUploadMiddleware.single('file'),
  uploadController.uploadImage,
);

export default uploadRouter;
