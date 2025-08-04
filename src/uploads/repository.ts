import { PrismaClient, UploadType } from '@prisma/client';
import { CsvUploadCreateDto } from './dto/csv-upload-create.dto';

export default class UploadRepository {
  constructor(private readonly prisma: PrismaClient) {
    // PrismaClient는 생성자 주입을 통해 전달받습니다.
  }

  /**
   * 업로드 등록
   */
  async create(dto: CsvUploadCreateDto) {
    return this.prisma.upload.create({
      data: dto,
    });
  }

  /**
   * 업로드 단건 조회
   */
  async findById(uploadId: number) {
    return this.prisma.upload.findUnique({
      where: { id: uploadId },
    });
  }

  /**
   * 업로드 목록 조회 + 필터 + 페이지네이션
   */
  async findAll({
    companyId,
    type,
    page = 1,
    limit = 10,
  }: {
    companyId: number;
    type?: string;
    page?: number;
    limit?: number;
  }) {
    const where = {
      companyId,
      ...(type ? { fileType: type as UploadType } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.upload.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.upload.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
    };
  }
}
