import { v4 as uuid } from 'uuid';
import admin from '../common/utils/firebase-admin';

export default class UploadRepository {
  private readonly bucket = admin.storage().bucket();

  async uploadImageToFirebase(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    folder: string = 'images',
  ): Promise<{ imageUrl: string; filename: string }> {
    const safeName = originalName.replace(/[^a-zA-Z0-9.]/g, '_');
    const filename = `${folder}/${Date.now()}-${safeName}`;
    const blob = this.bucket.file(filename);
    const token = uuid();

    return new Promise((resolve, reject) => {
      const blobStream = blob.createWriteStream({
        metadata: {
          contentType: mimeType,
          metadata: { firebaseStorageDownloadTokens: token },
        },
      });

      blobStream.on('error', (err) => reject(err));

      blobStream.on('finish', () => {
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${this.bucket.name}/o/${encodeURIComponent(
          blob.name,
        )}?alt=media&token=${token}`;

        resolve({ imageUrl, filename });
      });

      blobStream.end(fileBuffer);
    });
  }
}
