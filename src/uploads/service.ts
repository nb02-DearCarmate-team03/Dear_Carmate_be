import { CsvUploadCreateDto } from './dto/csv-upload-create.dto';
import UploadRepository from './repository';

export default class UploadService {
  constructor(private readonly uploadRepository: UploadRepository) {
    // UploadRepository는 생성자 주입을 통해 전달받습니다.
  }

  /**
   * CSV 업로드 등록
   */
  async createUpload(dto: CsvUploadCreateDto): Promise<number> {
    const newUpload = await this.uploadRepository.create(dto);
    return newUpload.id;
  }

  /**
   * 단건 업로드 조회 (상세)
   */
  async getUploadById(uploadId: number) {
    return this.uploadRepository.findById(uploadId);
  }

  /**
   * 업로드 목록 조회
   */
  async getUploads(params: { companyId: number; type?: string; page?: number; limit?: number }) {
    return this.uploadRepository.findAll(params);
  }
}
