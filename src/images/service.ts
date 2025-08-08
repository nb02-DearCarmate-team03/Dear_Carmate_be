import UploadRepository from './repository';

export default class UploadService {
  private uploadRepository: UploadRepository;

  constructor() {
    this.uploadRepository = new UploadRepository();
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new Error('이미지 파일이 없습니다.');
    }

    return this.uploadRepository.uploadImageToFirebase(
      file.buffer,
      file.originalname,
      file.mimetype,
    );
  }
}
