import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
// eslint-disable-next-line
import { v4 as uuid } from 'uuid';
import serviceAccount from '../../config/firebase-adminsdk.json'; // Firebase 서비스 계정 키 파일설정 경로 수정필요함

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_BUCKET_NAME,
  });
}

const bucket = admin.storage().bucket();

export default class ImageController {
  // eslint-disable-next-line
  uploadImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ message: '이미지 파일이 없습니다.' });
        return;
      }

      const filename = `images/${Date.now()}-${req.file.originalname}`;
      const blob = bucket.file(filename);
      const token = uuid();

      const blobStream = blob.createWriteStream({
        metadata: {
          contentType: req.file.mimetype,
          metadata: {
            firebaseStorageDownloadTokens: token,
          },
        },
      });

      blobStream.on('error', (err) => {
        console.error('Firebase 업로드 실패:', err);
        next(err);
      });

      blobStream.on('finish', () => {
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(blob.name)}?alt=media&token=${token}`;
        res.status(200).json({ imageUrl });
      });

      blobStream.end(req.file.buffer);
    } catch (error) {
      next(error);
    }
  };
}
