import { v4 as uuid } from 'uuid';
import type { Bucket } from '@google-cloud/storage';

export default class UploadRepository {
  constructor(private readonly bucket: Bucket) {
    // UploadRepository는 Firebase Storage와의 상호작용을 담당합니다.
    // 생성자에서 Firebase Storage 버킷 인스턴스를 주입받습니다.
  }

  async uploadImageToFirebase(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    folder: string = 'images',
  ): Promise<{ imageUrl: string; filename: string }> {
    const safeName = originalName.replace(/[^a-zA-Z0-9.]/g, '_');
    const uniqueId = uuid();
    const filename = `${folder}/${Date.now()}-${uniqueId}-${safeName}`;
    const blob = this.bucket.file(filename);
    const token = uuid();

    await new Promise<void>((resolve, reject) => {
      const blobStream = blob.createWriteStream({
        metadata: {
          contentType: mimeType,
          metadata: { firebaseStorageDownloadTokens: token },
        },
      });

      blobStream.on('error', reject);
      blobStream.on('finish', resolve);

      blobStream.end(fileBuffer);
    });

    const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${this.bucket.name}/o/${encodeURIComponent(
      blob.name,
    )}?alt=media&token=${token}`;

    return { imageUrl, filename };
  }
}
