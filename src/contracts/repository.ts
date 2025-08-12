import { Prisma, PrismaClient, ContractStatus as PrismaContractStatus } from '@prisma/client';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { BadRequestError } from '../common/errors/bad-request-error';

// 공통 include

// 공백이 아닌 문자열 판별
const isNonEmptyText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

// meetings 아이템의 date 존재 확인용 타입가드
type MeetingLike = { date?: string | null; alarms?: unknown };
const hasNonEmptyDateField = <T extends MeetingLike>(value: T): value is T & { date: string } =>
  isNonEmptyText((value as any)?.date);

// Date 생성용 통합 변환기
const convertToDate = (value: string | number | Date): Date => new Date(value as any);

const toDateStrict = (value: string | number | Date): Date => new Date(value as any);

type MaybeMeeting = { date?: string | null; alarms?: unknown };

const hasNonEmptyDate = <T extends MaybeMeeting>(value: T): value is T & { date: string } => {
  return typeof value?.date === 'string' && value.date.trim().length > 0;
};

const contractInclude = {
  user: { select: { id: true, name: true } },
  customer: { select: { id: true, name: true } },
  car: { select: { id: true, model: true } },
  meetings: { include: { alarms: true } },
  contractDocuments: { select: { id: true, fileName: true } },
} satisfies Prisma.ContractInclude;

export type ContractWithRelations = Prisma.ContractGetPayload<{
  include: typeof contractInclude;
}>;

export type ContractSearchBy = 'customerName' | 'userName' | 'carNumber' | 'carModel' | 'all';

// 날짜 변환
const toDateOrUndefined = (value?: string | null): Date | undefined =>
  value ? new Date(value) : undefined;

// 날짜 변환
const toDateOrNull = (value?: string | null): Date | null => (value ? new Date(value) : null);

// 상태 변환
const toPrismaStatus = (value: unknown): PrismaContractStatus | undefined => {
  if (value == null) return undefined;

  if (Object.values(PrismaContractStatus).includes(value as PrismaContractStatus)) {
    return value as PrismaContractStatus;
  }

  if (typeof value === 'string') {
    const [first = ''] = value.split('|', 1);
    const key = first
      .trim()
      .replace(/[_\-\s]/g, '')
      .toLowerCase();
    const map: Record<string, PrismaContractStatus> = {
      carinspection: PrismaContractStatus.CAR_INSPECTION,
      pricenegotiation: PrismaContractStatus.PRICE_NEGOTIATION,
      contractdraft: PrismaContractStatus.CONTRACT_DRAFT,
      contractsuccessful: PrismaContractStatus.CONTRACT_SUCCESSFUL,
      contractfailed: PrismaContractStatus.CONTRACT_FAILED,
    };
    return map[key];
  }

  return undefined;
};

// where 생성
function buildWhere(
  companyId: number,
  searchBy?: ContractSearchBy,
  keyword?: string,
  status?: PrismaContractStatus,
): Prisma.ContractWhereInput {
  const base: Prisma.ContractWhereInput = { companyId, ...(status ? { status } : {}) };

  const trimmed = keyword?.trim();
  if (!trimmed) return base;

  switch (searchBy) {
    case 'customerName':
      return { ...base, customer: { name: { contains: trimmed, mode: 'insensitive' } } };
    case 'userName':
      return { ...base, user: { name: { contains: trimmed, mode: 'insensitive' } } };
    case 'carNumber':
      return { ...base, car: { carNumber: { contains: trimmed, mode: 'insensitive' } } };
    case 'carModel':
      return { ...base, car: { model: { contains: trimmed, mode: 'insensitive' } } };
    case 'all':
    default:
      return {
        ...base,
        OR: [
          { customer: { name: { contains: trimmed, mode: 'insensitive' } } },
          { user: { name: { contains: trimmed, mode: 'insensitive' } } },
          { car: { model: { contains: trimmed, mode: 'insensitive' } } },
          { car: { carNumber: { contains: trimmed, mode: 'insensitive' } } },
        ],
      };
  }
}

export default class ContractRepository {
  private readonly prisma: PrismaClient | Prisma.TransactionClient;

  constructor(prisma: PrismaClient | Prisma.TransactionClient) {
    this.prisma = prisma;
  }

  // 계약 등록
  async createContract(
    createData: CreateContractDto & {
      userId: number;
      customerId: number;
      carId: number;
      companyId: number;
    },
  ): Promise<ContractWithRelations> {
    const { meetings, contractDate, ...scalarFields } = createData;

    return this.prisma.contract.create({
      data: {
        ...scalarFields,
        contractDate: toDateOrUndefined(contractDate),
        meetings:
          Array.isArray(meetings) && meetings.length > 0
            ? {
                create: meetings.filter(hasNonEmptyDateField).map((meeting) => ({
                  date: convertToDate(meeting.date),
                  alarms:
                    Array.isArray(meeting.alarms) && meeting.alarms.length > 0
                      ? {
                          create: meeting.alarms
                            .filter(isNonEmptyText)
                            .map((text) => ({ time: convertToDate(text) })),
                        }
                      : undefined,
                })),
              }
            : undefined,
      },
      include: contractInclude,
    });
  }

  // 계약 조회
  async findContracts(params: {
    companyId: number;
    searchBy?: ContractSearchBy;
    keyword?: string;
    status?: PrismaContractStatus;
    skip?: number;
    take?: number;
  }): Promise<ContractWithRelations[]> {
    const where = buildWhere(params.companyId, params.searchBy, params.keyword, params.status);

    return this.prisma.contract.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: params.skip,
      take: params.take,
      include: contractInclude,
    });
  }

  // 계약 개수 조회
  async countContracts(params: {
    companyId: number;
    searchBy?: ContractSearchBy;
    keyword?: string;
    status?: PrismaContractStatus;
  }): Promise<number> {
    const where = buildWhere(params.companyId, params.searchBy, params.keyword, params.status);
    return this.prisma.contract.count({ where });
  }

  // 계약 단건 조회
  async findContractById(contractId: number): Promise<ContractWithRelations | null> {
    return this.prisma.contract.findUnique({
      where: { id: contractId },
      include: contractInclude,
    });
  }

  // 계약 수정
  async updateContract(
    contractId: number,
    updateData: UpdateContractDto,
  ): Promise<ContractWithRelations> {
    const prismaUpdate: Prisma.ContractUpdateInput = {};

    if (updateData.status !== undefined) {
      const mapped = toPrismaStatus(updateData.status as unknown);
      if (!mapped) {
        throw new BadRequestError('잘못된 요청입니다.');
      }
      prismaUpdate.status = mapped;
    }

    if (updateData.contractPrice !== undefined) {
      prismaUpdate.contractPrice = updateData.contractPrice;
    }

    if (updateData.resolutionDate !== undefined) {
      prismaUpdate.resolutionDate = toDateOrNull(updateData.resolutionDate);
    }

    if (updateData.userId !== undefined) prismaUpdate.user = { connect: { id: updateData.userId } };
    if (updateData.customerId !== undefined)
      prismaUpdate.customer = { connect: { id: updateData.customerId } };
    if (updateData.carId !== undefined) prismaUpdate.car = { connect: { id: updateData.carId } };

    if (updateData.meetings !== undefined) {
      const meetingsToCreate = (updateData.meetings ?? [])
        .filter(hasNonEmptyDateField) // ✅ date 있는 항목만
        .map((meeting) => ({
          // ❌ (meeting: UpdateMeetingDto) 표기 금지
          date: convertToDate(meeting.date),
          alarms:
            Array.isArray(meeting.alarms) && meeting.alarms.length > 0
              ? {
                  create: meeting.alarms
                    .filter(isNonEmptyText)
                    .map((text) => ({ time: convertToDate(text) })),
                }
              : undefined,
        }));

      prismaUpdate.meetings = {
        deleteMany: { contractId },
        ...(meetingsToCreate.length > 0 ? { create: meetingsToCreate } : {}),
      };

      prismaUpdate.meetings = {
        deleteMany: { contractId },
        ...(meetingsToCreate.length > 0 ? { create: meetingsToCreate } : {}),
      };
    }

    if (updateData.contractDocuments !== undefined) {
      const documentIds = (updateData.contractDocuments ?? [])
        .map((d) => (typeof d === 'number' ? d : d?.id))
        .filter((id): id is number => Number.isInteger(id));

      if (documentIds.length > 0) {
        const existing = await this.prisma.contractDocument.findMany({
          where: { id: { in: documentIds } },
          select: { id: true },
        });

        const found = new Set(existing.map((d) => d.id));
        const missing = documentIds.filter((id) => !found.has(id));
        if (missing.length > 0) {
          throw new BadRequestError('존재하지 않는 계약서 ID입니다.');
        }

        await this.prisma.contractDocument.updateMany({
          where: { id: { in: documentIds } },
          data: { contractId },
        });
      }
    }

    return this.prisma.contract.update({
      where: { id: contractId },
      data: prismaUpdate,
      include: contractInclude,
    });
  }

  // 계약 삭제
  async deleteContract(contractId: number): Promise<void> {
    await this.prisma.contract.delete({ where: { id: contractId } });
  }

  // 차량 선택 목록 조회
  async findCarsByCompanyId(companyId: number) {
    return this.prisma.car.findMany({
      where: { companyId },
      select: { id: true, model: true, carNumber: true },
      orderBy: { id: 'asc' },
    });
  }

  // 고객 선택 목록 조회
  async findCustomersByCompanyId(companyId: number) {
    return this.prisma.customer.findMany({
      where: { companyId },
      select: { id: true, name: true, email: true },
      orderBy: { id: 'asc' },
    });
  }

  // 사용자 선택 목록 조회
  async findUsersByCompanyId(companyId: number) {
    return this.prisma.user.findMany({
      where: { companyId },
      select: { id: true, name: true, email: true },
      orderBy: { id: 'asc' },
    });
  }
}
