import UploadRepository from './repository';

export default class UploadService {
  constructor(private readonly uploadRepository: UploadRepository) {
    // UploadService는 이미지 업로드 로직을 담당합니다.
  }

  async uploadImage(file: Express.Multer.File, folder?: string) {
    return this.uploadRepository.uploadImageToFirebase(
      file.buffer,
      file.originalname,
      file.mimetype,
      folder,
    );
  }
}
