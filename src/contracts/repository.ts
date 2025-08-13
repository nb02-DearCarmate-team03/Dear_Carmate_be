import {
  Prisma,
  PrismaClient,
  ContractStatus as PrismaContractStatus,
  CarStatus,
} from '@prisma/client';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { BadRequestError } from '../common/errors/bad-request-error';
import { ForbiddenError } from '../common/errors/forbidden-error';

/* ------------------------------ 공통 유틸 ------------------------------ */

const isNonEmptyText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

type MeetingLike = { date?: string | null; alarms?: unknown };
const hasNonEmptyDateField = <T extends MeetingLike>(value: T): value is T & { date: string } =>
  isNonEmptyText((value as any)?.date);

const convertToDate = (value: string | number | Date): Date => new Date(value as any);

function toDateOrUndefined(input: unknown): Date | undefined {
  if (input === null || input === undefined || input === '') return undefined;
  const date = new Date(input as any);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

const toDateOrNull = (value?: string | null): Date | null => (value ? new Date(value) : null);

function toNumberOrUndefined(input: unknown): number | undefined {
  if (input === null || input === undefined || input === '') return undefined;
  if (typeof input === 'number') return Number.isFinite(input) ? input : undefined;

  const maybeDecimal = input as any;
  if (maybeDecimal && typeof maybeDecimal.toNumber === 'function') {
    const n = maybeDecimal.toNumber();
    return Number.isFinite(n) ? n : undefined;
  }

  const n = Number(String(input).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

/** 업데이트에서 수정되면 안되는(불변) 필드 제거 */
function stripImmutableContractFields<T extends Record<string, any>>(input: T): Partial<T> {
  const {
    id,
    companyId,
    userId, // 담당자 고정
    createdAt,
    updatedAt,
    deletedAt,
    // 관계/배열은 별도 처리
    meetings,
    contractDocuments,
    carId,
    customerId,
    ...scalarsOnly
  } = input as any;
  return scalarsOnly;
}

/* ------------------------------ 상태 매핑 ------------------------------ */

const PRISMA_STATUS_VALUES = new Set<PrismaContractStatus>(
  Object.values(PrismaContractStatus) as PrismaContractStatus[],
);

const STATUS_ALIAS: Record<string, PrismaContractStatus> = {
  carinspection: PrismaContractStatus.CAR_INSPECTION,
  pricenegotiation: PrismaContractStatus.PRICE_NEGOTIATION,
  contractdraft: PrismaContractStatus.CONTRACT_DRAFT,
  contractsuccessful: PrismaContractStatus.CONTRACT_SUCCESSFUL,
  contractfailed: PrismaContractStatus.CONTRACT_FAILED,
};

function normalizeStatusKey(input: string) {
  return input
    .trim()
    .replace(/[_\-\s]/g, '')
    .toLowerCase();
}

export function toPrismaStatus(value: unknown): PrismaContractStatus | undefined {
  if (value == null) return undefined;
  if (PRISMA_STATUS_VALUES.has(value as PrismaContractStatus)) {
    return value as PrismaContractStatus;
  }
  if (typeof value === 'string') {
    const [first = ''] = value.split('|', 1);
    return STATUS_ALIAS[normalizeStatusKey(first)];
  }
  return undefined;
}

/* ------------------------------ 공통 include ------------------------------ */

const contractInclude = {
  user: { select: { id: true, name: true } },
  customer: { select: { id: true, name: true } },
  car: { select: { id: true, model: true } },
  meetings: { include: { alarms: true } },
  contractDocuments: { select: { id: true, fileName: true } },
};

export type ContractWithRelations = Prisma.ContractGetPayload<{
  include: typeof contractInclude;
}>;

export type ContractSearchBy = 'customerName' | 'userName' | 'carNumber' | 'carModel' | 'all';

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

/* ------------------------------ Repository ------------------------------ */

export default class ContractRepository {
  private readonly prisma: PrismaClient | Prisma.TransactionClient;

  constructor(prisma: PrismaClient | Prisma.TransactionClient) {
    this.prisma = prisma;
  }

  /* 계약 등록 */
  async createContract(
    createData: CreateContractDto & {
      userId: number;
      customerId: number;
      carId: number;
      companyId: number;
    },
  ): Promise<ContractWithRelations> {
    const { meetings, contractDate, ...scalarFields } = createData;

    // (1) 차량 검증 (회사 소속 + 보유중 만 허용) + 차량 가격 조회
    const targetCar = await this.prisma.car.findFirst({
      where: { id: scalarFields.carId, companyId: scalarFields.companyId },
      select: { id: true, status: true, price: true },
    });

    if (!targetCar) {
      const error: any = new Error('차량을 찾을 수 없습니다.');
      error.statusCode = 404;
      throw error;
    }
    if (targetCar.status !== CarStatus.POSSESSION) {
      const error: any = new Error('보유중 차량만 선택할 수 있습니다.');
      error.statusCode = 400;
      throw error;
    }

    // (2) 계약 가격 결정: 입력값 우선(0 허용), 없으면 차량 가격
    const incomingPrice = toNumberOrUndefined((scalarFields as any).contractPrice);
    let finalContractPrice: number | undefined;
    if (incomingPrice !== undefined) {
      finalContractPrice = incomingPrice;
    } else if (toNumberOrUndefined(targetCar.price) !== undefined) {
      finalContractPrice = toNumberOrUndefined(targetCar.price);
    } else {
      finalContractPrice = undefined;
    }

    // (3) 상태 기본값 보정
    const normalizedStatus =
      toPrismaStatus((scalarFields as any).status) ?? PrismaContractStatus.CAR_INSPECTION;

    // (4) 계약 생성
    const created = await this.prisma.contract.create({
      data: {
        ...scalarFields,
        status: normalizedStatus,
        contractPrice: finalContractPrice,
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

    // (5) 차량 상태 갱신: 계약 진행중
    await this.prisma.car.update({
      where: { id: created.carId },
      data: { status: CarStatus.CONTRACT_PROCEEDING },
    });

    return created;
  }

  /* 계약 목록 */
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
      orderBy: { updatedAt: 'desc' },
      skip: params.skip,
      take: params.take,
      include: contractInclude,
    });
  }

  /* 계약 개수 */
  async countContracts(params: {
    companyId: number;
    searchBy?: ContractSearchBy;
    keyword?: string;
    status?: PrismaContractStatus;
  }): Promise<number> {
    const where = buildWhere(params.companyId, params.searchBy, params.keyword, params.status);
    return this.prisma.contract.count({ where });
  }

  /* 계약 단건 */
  async findContractById(contractId: number): Promise<ContractWithRelations | null> {
    return this.prisma.contract.findUnique({
      where: { id: contractId },
      include: contractInclude,
    });
  }

  /* 계약 수정 */
  async updateContract(
    contractId: number,
    updateData: UpdateContractDto,
  ): Promise<ContractWithRelations> {
    // 1) 스칼라만 추출(관계/배열 제거)
    const {
      contractDocuments: _contractDocuments,
      meetings: _meetings,
      userId: _userId, // 담당자 수정 금지
      customerId: _customerId,
      carId: _carId,
      ...scalarsOnly
    } = updateData as any;

    const prismaUpdate: Prisma.ContractUpdateInput = {
      ...stripImmutableContractFields(scalarsOnly),
    };

    // 2) 상태/금액/해결일 개별 매핑
    if (updateData.status !== undefined) {
      const mapped = toPrismaStatus(updateData.status as unknown);
      if (!mapped) throw new BadRequestError('잘못된 요청입니다.');
      prismaUpdate.status = mapped;
    }

    if (updateData.contractPrice !== undefined) {
      // Decimal | number 모두 허용
      prismaUpdate.contractPrice = updateData.contractPrice as any;
    }

    if (updateData.resolutionDate !== undefined) {
      prismaUpdate.resolutionDate = toDateOrNull(updateData.resolutionDate);
    }

    // 3) 관계 연결 (userId는 수정 금지)
    if (updateData.customerId !== undefined) {
      prismaUpdate.customer = { connect: { id: updateData.customerId } };
    }
    if (updateData.carId !== undefined) {
      prismaUpdate.car = { connect: { id: updateData.carId } };
    }

    // 4) 미팅 전체 교체
    if (updateData.meetings !== undefined) {
      const meetingsToCreate = (updateData.meetings ?? [])
        .filter(hasNonEmptyDateField)
        .map((meeting) => ({
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
    }

    // 5) 계약서 문서: 기존 문서 ID 연결 (선택적, 별도 쿼리)
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
        if (missing.length > 0) throw new BadRequestError('존재하지 않는 계약서 ID입니다.');

        await this.prisma.contractDocument.updateMany({
          where: { id: { in: documentIds } },
          data: { contractId },
        });
      }
    }

    // 6) 업로드된 새 파일이 있다면 Nested create 병합
    const uploadedFiles = (updateData as any)?.uploadedFiles as
      | Array<{ name: string; path: string; size: number }>
      | undefined;

    if (Array.isArray(uploadedFiles) && uploadedFiles.length > 0) {
      prismaUpdate.contractDocuments = {
        ...((prismaUpdate.contractDocuments as Prisma.ContractDocumentUpdateManyWithoutContractNestedInput) ??
          {}),
        create: [
          ...(((prismaUpdate.contractDocuments as any)?.create as any[] | undefined) ?? []),
          ...uploadedFiles.map((file) => ({
            fileName: file.name,
            path: file.path,
            size: file.size,
          })),
        ],
      };
    }

    // 7) 최종 업데이트 실행
    return this.prisma.contract.update({
      where: { id: contractId },
      data: prismaUpdate,
      include: contractInclude,
    });
  }

  /* 계약 삭제 */
  async deleteContract(contractId: number): Promise<void> {
    await this.prisma.contract.delete({ where: { id: contractId } });
  }

  /* 계약용 차량 선택 목록 (보유중) */
  async findCarsForContract(companyId: number) {
    return this.prisma.car.findMany({
      where: { companyId, status: CarStatus.POSSESSION },
      select: { id: true, model: true, carNumber: true, price: true },
      orderBy: [{ model: 'asc' }, { carNumber: 'asc' }],
    });
  }

  async findCarById(id: number, companyId: number) {
    return this.prisma.car.findFirst({
      where: { id, companyId },
      select: { id: true, companyId: true, status: true, model: true, carNumber: true },
    });
  }

  /* 계약용 고객/사용자 선택 목록 */
  async findCustomersByCompanyId(companyId: number) {
    return this.prisma.customer.findMany({
      where: { companyId, deletedAt: null },
      select: { id: true, name: true, email: true },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });
  }

  async findUsersByCompanyId(companyId: number) {
    return this.prisma.user.findMany({
      where: { companyId },
      select: { id: true, name: true, email: true },
      orderBy: { id: 'asc' },
    });
  }

  /** 등록자 본인만 수정(서비스 레벨의 보조 보호용) */
  async updateByOwnerOrFail(
    userId: number,
    companyId: number,
    id: number,
    data: Prisma.ContractUpdateInput,
    prismaClient: PrismaClient | Prisma.TransactionClient = this.prisma,
  ) {
    const { count } = await prismaClient.contract.updateMany({
      where: { id, companyId, userId },
      data,
    });

    if (count === 0) {
      throw new ForbiddenError('본인이 등록한 계약만 수정할 수 있습니다.');
    }

    return prismaClient.contract.findUnique({
      where: { id },
      include: {
        car: { select: { id: true, model: true } },
        customer: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
        meetings: true,
        contractDocuments: { select: { id: true, fileName: true } },
      },
    });
  }
}
