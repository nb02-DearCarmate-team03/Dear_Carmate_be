import { parse } from 'csv-parse/sync';
import { UploadType } from '@prisma/client';
import UploadRepository from './repository';
import { CsvUploadCreateDto } from './dto/csv-upload-create.dto';
import { downloadCsvFile } from '../common/utils/csv-downloader';

export default class UploadService {
  constructor(private readonly uploadRepository: UploadRepository) {
    // 생성자에서 UploadRepository 인스턴스를 주입받습니다.
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

    const { fileUrl, fileType, companyId } = upload;

    const fileBuffer = await downloadCsvFile(fileUrl);

    const records = parse(fileBuffer.toString(), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    // CSV 파일의 각 행을 객체로 변환합니다.
    await this.uploadRepository.prisma.$transaction(async (tx) => {
      if (fileType === UploadType.CUSTOMER) {
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
        // 고객 데이터 저장
        await tx.customer.createMany({ data: customerData });
      } else if (fileType === UploadType.CAR) {
        const carData = records.map((row: any) => ({
          carNumber: row.carNumber,
          manufacturer: row.manufacturer,
          model: row.model,
          type: row.type,
          manufacturingYear: Number(row.manufacturingYear),
          mileage: Number(row.mileage),
          price: Number(row.price),
          accidentCount: Number(row.accidentCount),
          explanation: row.explanation,
          accidentDetails: row.accidentDetails,
          companyId,
        }));
        await tx.car.createMany({ data: carData });
      } else {
        throw new Error(`지원하지 않는 업로드 타입: ${fileType}`);
      }
    });
  }
}
