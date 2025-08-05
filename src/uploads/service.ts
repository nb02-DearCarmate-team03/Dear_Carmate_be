import { parse } from 'csv-parse/sync';
import axios from 'axios';
import UploadRepository from './repository';
import { CsvUploadCreateDto } from './dto/csv-upload-create.dto';

export default class UploadService {
  constructor(private readonly uploadRepository: UploadRepository) {
    // Prisma 클라이언트 인스턴스를 생성합니다.
  }

  async createUpload(dto: CsvUploadCreateDto): Promise<number> {
    const newUpload = await this.uploadRepository.create(dto);
    return newUpload.id;
  }

  async getUploadById(uploadId: number) {
    return this.uploadRepository.findById(uploadId);
  }

  async getUploads(params: { companyId: number; type?: string; page?: number; limit?: number }) {
    return this.uploadRepository.findAll(params);
  }

  /**
   * 업로드된 CSV 파일을 파싱하여 데이터베이스에 저장합니다.
   * @param uploadId 업로드 ID
   */
  async processUpload(uploadId: number): Promise<void> {
    const upload = await this.uploadRepository.findById(uploadId);
    if (!upload) throw new Error('해당 업로드 정보를 찾을 수 없습니다');

    const { fileUrl, type, companyId } = upload;

    // S3에서 파일 다운로드
    const fileBuffer = await this.downloadCsvFile(fileUrl);

    // CSV 파싱
    const records = parse(fileBuffer.toString(), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    // 트랜잭션으로 삽입
    await this.uploadRepository.prisma.$transaction(async (tx) => {
      if (type === 'customer') {
        const customerData = records.map((row: any) => ({
          name: row.name,
          gender: row.gender,
          phoneNumber: row.phoneNumber,
          ageGroup: row.ageGroup,
          region: row.region,
          email: row.email,
          memo: row.memo,
          companyId,
        }));
        await tx.customer.createMany({ data: customerData });
      } else if (type === 'car') {
        const carData = records.map((row: any) => ({
          carNumber: row.carNumber,
          manufacturer: row.manufacturer,
          model: row.model,
          year: Number(row.year),
          mileage: Number(row.mileage),
          price: Number(row.price),
          accidentCount: Number(row.accidentCount),
          description: row.description,
          accidentDetails: row.accidentDetails,
          companyId,
        }));
        await tx.car.createMany({ data: carData });
      } else {
        throw new Error(`지원하지 않는 업로드 타입: ${type}`);
      }
    });
  }

  /**
   * CSV 파일 다운로드 (S3에서)
   */
  private async downloadCsvFile(fileUrl: string): Promise<Buffer> {
    const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
  }
}
