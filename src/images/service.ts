import UploadRepository from './repository';

export default class UploadService {
  private readonly uploadRepository: UploadRepository;

  constructor(uploadRepository: UploadRepository = new UploadRepository()) {
    this.uploadRepository = uploadRepository;
  }

  async uploadImage(file: Express.Multer.File, folder?: string) {
    if (!file) {
      throw new Error('이미지 파일이 없습니다.');
    }
    return this.uploadRepository.uploadImageToFirebase(
      file.buffer,
      file.originalname,
      file.mimetype,
      folder,
    );
  }
}
