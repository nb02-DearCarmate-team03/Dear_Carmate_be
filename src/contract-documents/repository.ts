import {
  PrismaClient,
  Prisma,
  ContractStatus as PrismaContractStatus,
  ContractDocument,
} from '@prisma/client';

type DropdownRow = {
  id: number;
  carNumber: string | null;
  model: string | null;
  customerName: string | null;
};

export default class ContractDocumentsRepository {
  private readonly prisma: PrismaClient;

  // 👇 빈 생성자 경고를 피하기 위해 명시 대입
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /** 계약 보드에 실제로 보이는 상태(가격협의/계약서작성중)만 반환 */
  async findContractsForDocumentDropdown(
    keyword?: string,
    boardOnly: boolean = true,
  ): Promise<DropdownRow[]> {
    const where: Prisma.ContractWhereInput = {};

    if (boardOnly) {
      where.status = {
        in: [PrismaContractStatus.PRICE_NEGOTIATION, PrismaContractStatus.CONTRACT_DRAFT],
      } as Prisma.EnumContractStatusFilter;
    }

    if (keyword && keyword.trim()) {
      const q = keyword.trim();
      where.OR = [
        { user: { is: { name: { contains: q, mode: 'insensitive' } } } },
        { customer: { is: { name: { contains: q, mode: 'insensitive' } } } },
        { car: { is: { carNumber: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    const rows = await this.prisma.contract.findMany({
      where,
      select: {
        id: true,
        car: { select: { carNumber: true, model: true } },
        customer: { select: { name: true } },
      },
      orderBy: { id: 'desc' },
      take: 50,
    });

    return rows.map((r) => ({
      id: r.id,
      carNumber: r.car?.carNumber ?? null,
      model: r.car?.model ?? null,
      customerName: r.customer?.name ?? null,
    }));
  }

  async contractExists(contractId: number): Promise<boolean> {
    const row = await this.prisma.contract.findUnique({
      where: { id: contractId },
      select: { id: true },
    });
    return !!row;
  }

  async countDocumentsByContract(contractId: number): Promise<number> {
    return this.prisma.contractDocument.count({
      where: { contractId, deletedAt: null },
    });
  }

  /** 파일 다건 생성 — 루프 안 await 제거 (트랜잭션으로 일괄 실행) */
  async createContractDocuments(
    contractId: number,
    userId: number,
    files: Express.Multer.File[],
  ): Promise<ContractDocument[]> {
    if (!files?.length) return [];

    const ops = files.map((f) =>
      this.prisma.contractDocument.create({
        data: {
          contractId,
          uploadedBy: userId,
          documentName: f.originalname ?? null,
          fileName: f.originalname ?? null,
          filePath: (f as any).path ?? f.filename,
          fileSize: f.size,
          fileType: f.mimetype ?? 'application/octet-stream',
        },
      }),
    );

    // 한 번에 실행 → no-await-in-loop 해결
    const created = await this.prisma.$transaction(ops);
    return created;
  }

  async findDocumentById(id: number) {
    return this.prisma.contractDocument.findUnique({ where: { id } });
  }

  async findDocumentsByIds(ids: number[]) {
    if (!ids.length) return [];
    return this.prisma.contractDocument.findMany({
      where: { id: { in: ids }, deletedAt: null },
    });
  }

  async deleteDocumentsOfContract(contractId: number, ids: number[]) {
    if (!ids.length) return 0;
    const r = await this.prisma.contractDocument.updateMany({
      where: { id: { in: ids }, contractId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return r.count;
  }

  async findContractDocuments(page: number, pageSize: number, keyword?: string, searchBy?: string) {
    const where: Prisma.ContractDocumentWhereInput = { deletedAt: null };

    if (keyword && keyword.trim()) {
      const q = keyword.trim();
      if (searchBy === 'userName') {
        where.contract = {
          is: {
            user: { is: { name: { contains: q, mode: 'insensitive' } } },
          },
        };
      } else {
        where.contract = {
          is: {
            customer: { is: { name: { contains: q, mode: 'insensitive' } } },
          },
        };
      }
    }

    const documents = await this.prisma.contractDocument.findMany({
      where,
      include: {
        contract: {
          select: {
            id: true,
            contractDate: true,
            user: { select: { name: true } },
            car: { select: { carNumber: true } },
            customer: { select: { name: true } },
          },
        },
      },
      orderBy: [{ contractId: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { documents };
  }

  async countDistinctContracts(keyword?: string, searchBy?: string) {
    const where: Prisma.ContractWhereInput = {};
    if (keyword && keyword.trim()) {
      const q = keyword.trim();
      if (searchBy === 'userName') {
        where.user = { is: { name: { contains: q, mode: 'insensitive' } } };
      } else {
        where.customer = {
          is: { name: { contains: q, mode: 'insensitive' } },
        };
      }
    }
    return this.prisma.contract.count({ where });
  }

  async findLatestContractIdByCarNumber(carNumber: string) {
    const row = await this.prisma.contract.findFirst({
      where: { car: { is: { carNumber } } },
      orderBy: { id: 'desc' },
      select: { id: true },
    });
    return row?.id;
  }
}
