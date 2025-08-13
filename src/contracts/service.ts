// src/contracts/service.ts
import { Prisma, PrismaClient, ContractStatus as PrismaContractStatus } from '@prisma/client';

import ContractRepository, { ContractSearchBy, ContractWithRelations } from './repository';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { mapContract } from './contract.mapper';
import { refreshAggregatesAfterContractChange } from './contract.aggregates';
import { NotFoundError } from '../common/errors/not-found-error';

type RequestUser = {
  id: number;
  companyId: number;
  name: string;
  email: string;
  isAdmin: boolean;
};

type ItemForDropdown = { id: number; data: string };

// 상태 → 응답 키
const STATUS_KEY: Record<
  PrismaContractStatus,
  'carInspection' | 'priceNegotiation' | 'contractDraft' | 'contractSuccessful' | 'contractFailed'
> = {
  CAR_INSPECTION: 'carInspection',
  PRICE_NEGOTIATION: 'priceNegotiation',
  CONTRACT_DRAFT: 'contractDraft',
  CONTRACT_SUCCESSFUL: 'contractSuccessful',
  CONTRACT_FAILED: 'contractFailed',
};

// 숫자 변환 유틸 (문자/Decimal 포함)
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

export class ContractService {
  private readonly prisma: PrismaClient;
  private readonly repository: ContractRepository;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.repository = new ContractRepository(prisma);
  }

  /** 담당자(등록자)만 수정/삭제 가능 */
  private async assertCanModify(user: RequestUser, contractId: number): Promise<void> {
    const userId = Number(user?.id);
    const companyId = Number(user?.companyId);
    if (!userId || !companyId) {
      const err: any = new Error('인증 정보가 없습니다.');
      err.statusCode = 403;
      err.code = 'AUTH_REQUIRED';
      throw err;
    }
    const found = await this.repository.findContractById(contractId);
    if (!found || Number(found.companyId) !== companyId) {
      throw new NotFoundError('계약을 찾을 수 없습니다.');
    }
    if (Number(found.userId) !== userId) {
      const err: any = new Error('담당자만 수정이 가능합니다');
      err.statusCode = 403;
      err.code = 'FORBIDDEN_ONLY_OWNER';
      throw err;
    }
  }

  // 단순 목록
  async getContracts(
    user: RequestUser,
    filters: { searchBy?: ContractSearchBy; keyword?: string },
  ): Promise<ReturnType<typeof mapContract>[]> {
    const rows = await this.repository.findContracts({
      companyId: user.companyId,
      searchBy: filters.searchBy,
      keyword: filters.keyword ?? '',
    });
    return rows.map(mapContract);
  }

  // 페이지 목록
  async getContractsPage(
    user: RequestUser,
    params: { searchBy?: ContractSearchBy; keyword?: string; page?: number; pageSize?: number },
  ): Promise<{
    currentPage: number;
    totalPages: number;
    totalItemCount: number;
    data: ReturnType<typeof mapContract>[];
  }> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(Math.max(1, params.pageSize ?? 10), 100);
    const skip = (page - 1) * pageSize;

    const [rows, total] = await Promise.all([
      this.repository.findContracts({
        companyId: user.companyId,
        searchBy: params.searchBy,
        keyword: params.keyword ?? '',
        skip,
        take: pageSize,
      }),
      this.repository.countContracts({
        companyId: user.companyId,
        searchBy: params.searchBy,
        keyword: params.keyword ?? '',
      }),
    ]);

    return {
      currentPage: page,
      totalPages: Math.ceil(total / pageSize),
      totalItemCount: total,
      data: rows.map(mapContract),
    };
  }

  // 상태별 그룹 + 페이지 요약
  async getContractsGroupedPage(
    user: RequestUser,
    params: { searchBy?: ContractSearchBy; keyword?: string; page?: number; pageSize?: number },
  ): Promise<{
    currentPage: number;
    totalPages: number;
    totalItemCount: number;
    data: {
      carInspection: { totalItemCount: number; data: ReturnType<typeof mapContract>[] };
      priceNegotiation: { totalItemCount: number; data: ReturnType<typeof mapContract>[] };
      contractDraft: { totalItemCount: number; data: ReturnType<typeof mapContract>[] };
      contractSuccessful: { totalItemCount: number; data: ReturnType<typeof mapContract>[] };
      contractFailed: { totalItemCount: number; data: ReturnType<typeof mapContract>[] };
    };
  }> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(Math.max(1, params.pageSize ?? 10), 100);
    const skip = (page - 1) * pageSize;

    const statuses: PrismaContractStatus[] = [
      'CAR_INSPECTION',
      'PRICE_NEGOTIATION',
      'CONTRACT_DRAFT',
      'CONTRACT_SUCCESSFUL',
      'CONTRACT_FAILED',
    ];

    const totalPromise = this.repository.countContracts({
      companyId: user.companyId,
      searchBy: params.searchBy,
      keyword: params.keyword ?? '',
    });

    const perStatusPromises = statuses.flatMap((status) => [
      this.repository.countContracts({
        companyId: user.companyId,
        searchBy: params.searchBy,
        keyword: params.keyword ?? '',
        status,
      }),
      this.repository.findContracts({
        companyId: user.companyId,
        searchBy: params.searchBy,
        keyword: params.keyword ?? '',
        status,
        skip,
        take: pageSize,
      }),
    ]);

    const [total, ...rest] = await Promise.all([totalPromise, ...perStatusPromises]);

    const grouped = {
      carInspection: { totalItemCount: 0, data: [] as ReturnType<typeof mapContract>[] },
      priceNegotiation: { totalItemCount: 0, data: [] as ReturnType<typeof mapContract>[] },
      contractDraft: { totalItemCount: 0, data: [] as ReturnType<typeof mapContract>[] },
      contractSuccessful: { totalItemCount: 0, data: [] as ReturnType<typeof mapContract>[] },
      contractFailed: { totalItemCount: 0, data: [] as ReturnType<typeof mapContract>[] },
    };

    statuses.forEach((status, idx) => {
      const count = rest[idx * 2] as number;
      const rows = rest[idx * 2 + 1] as ContractWithRelations[];
      const key = STATUS_KEY[status];
      grouped[key] = { totalItemCount: count, data: rows.map(mapContract) };
    });

    return {
      currentPage: page,
      totalPages: Math.ceil(total / pageSize),
      totalItemCount: total,
      data: grouped,
    };
  }

  // 단건
  async getContractById(contractId: number) {
    return this.repository.findContractById(contractId);
  }

  // 등록: 차량 가격 자동 반영 + 집계/상태 파생값 갱신
  async createContract(
    createData: CreateContractDto & {
      userId: number;
      customerId: number;
      carId: number;
      companyId: number;
    },
  ): Promise<ContractWithRelations> {
    // 차량 가격 조회
    const car = await this.prisma.car.findFirst({
      where: { id: createData.carId, companyId: createData.companyId },
      select: { id: true, price: true },
    });

    const requestPrice = toNumberOrUndefined((createData as any).contractPrice);
    const carPrice = toNumberOrUndefined((car as any)?.price);
    const finalContractPrice = requestPrice ?? carPrice ?? undefined;

    const created = await this.repository.createContract({
      ...createData,
      contractPrice: finalContractPrice,
    });

    // 생성 후 집계/상태 갱신
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await refreshAggregatesAfterContractChange(
        tx,
        createData.companyId,
        (created as any).customerId ?? created.customer?.id ?? null,
        (created as any).carId ?? created.car?.id ?? null,
      );
    });

    return created;
  }

  // 수정: 담당자만, 수정 후 집계 갱신 (userId 불변은 repository에서 보장)
  async updateContract(
    user: RequestUser,
    contractId: number,
    updateData: UpdateContractDto,
  ): Promise<ContractWithRelations> {
    await this.assertCanModify(user, contractId);

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const repo = new ContractRepository(tx);
      const updated = await repo.updateContract(contractId, updateData);

      await refreshAggregatesAfterContractChange(
        tx,
        user.companyId,
        updated.customer?.id ?? null,
        updated.car?.id ?? null,
      );

      return updated;
    });
  }

  // 삭제: 담당자만, 삭제 후 집계 갱신
  async deleteContract(user: RequestUser, contractId: number): Promise<void> {
    await this.assertCanModify(user, contractId);

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const repo = new ContractRepository(tx);
      const before = await repo.findContractById(contractId);
      if (!before) {
        const err: any = new Error('계약을 찾을 수 없습니다.');
        err.statusCode = 404;
        throw err;
      }

      await repo.deleteContract(contractId);

      await refreshAggregatesAfterContractChange(
        tx,
        user.companyId,
        before.customerId ?? null,
        before.carId ?? null,
      );
    });
  }

  // 드롭다운들
  async getContractCars(user: RequestUser): Promise<ItemForDropdown[]> {
    const rows = await this.repository.findCarsForContract(user.companyId);
    return rows.map((c) => ({ id: c.id, data: `${c.model}(${c.carNumber})` }));
  }

  async getContractCustomers(user: RequestUser) {
    // 프론트 드롭다운: "이름(email)" 형태로 만들고 싶으면 컨트롤러에서 가공
    return this.repository.findCustomersByCompanyId(user.companyId);
  }

  async getContractUsers(user: RequestUser) {
    return this.repository.findUsersByCompanyId(user.companyId);
  }
}
