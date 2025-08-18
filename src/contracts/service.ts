import { PrismaClient, Prisma, ContractStatus as PrismaContractStatus } from '@prisma/client';
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

export class ContractService {
  private readonly repository: ContractRepository;
  private readonly prisma?: PrismaClient;

  constructor(prismaOrRepository: PrismaClient | ContractRepository) {
    this.repository =
      prismaOrRepository instanceof ContractRepository
        ? prismaOrRepository
        : new ContractRepository(prismaOrRepository);

    if (!(prismaOrRepository instanceof ContractRepository)) {
      this.prisma = prismaOrRepository;
    }
  }

  /** 담당자(등록자)만 수정/삭제 가능 */
  private async assertCanModify(user: RequestUser, contractId: number): Promise<void> {
    const found = await this.repository.findContractById(contractId);
    if (!found || Number(found.companyId) !== Number(user.companyId)) {
      throw new NotFoundError('계약을 찾을 수 없습니다.');
    }
    if (Number(found.userId) !== Number(user.id)) {
      const error: any = new Error('담당자만 수정이 가능합니다');
      error.statusCode = 403;
      error.code = 'FORBIDDEN_ONLY_OWNER';
      throw error;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // 조회
  // ──────────────────────────────────────────────────────────────────────────────
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

    const [rows, totalItemCount] = await Promise.all([
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
      totalPages: Math.ceil(totalItemCount / pageSize),
      totalItemCount,
      data: rows.map(mapContract),
    };
  }

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

    const [totalItemCount, ...countsAndRows] = await Promise.all([
      totalPromise,
      ...perStatusPromises,
    ]);

    const grouped = {
      carInspection: { totalItemCount: 0, data: [] as ReturnType<typeof mapContract>[] },
      priceNegotiation: { totalItemCount: 0, data: [] as ReturnType<typeof mapContract>[] },
      contractDraft: { totalItemCount: 0, data: [] as ReturnType<typeof mapContract>[] },
      contractSuccessful: { totalItemCount: 0, data: [] as ReturnType<typeof mapContract>[] },
      contractFailed: { totalItemCount: 0, data: [] as ReturnType<typeof mapContract>[] },
    };

    statuses.forEach((status, idx) => {
      const count = countsAndRows[idx * 2] as number;
      const rows = countsAndRows[idx * 2 + 1] as ContractWithRelations[];
      const key = STATUS_KEY[status];
      grouped[key] = { totalItemCount: count, data: rows.map(mapContract) };
    });

    return {
      currentPage: page,
      totalPages: Math.ceil(totalItemCount / pageSize),
      totalItemCount,
      data: grouped,
    };
  }

  async getContractById(contractId: number) {
    return this.repository.findContractById(contractId);
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // 생성/수정/삭제
  // ──────────────────────────────────────────────────────────────────────────────

  /** 계약 등록 (가격/상태 계산은 Repository.createContract 내부 처리) */
  async createContract(
    user: RequestUser,
    createPayload: CreateContractDto & { customerId: number; carId: number; userId: number },
  ) {
    const finalUserId = createPayload.userId ?? user.id;

    if (this.prisma) {
      return this.prisma.$transaction(async (tx) => {
        const repo = new ContractRepository(tx);
        const created = await repo.createContract({
          ...createPayload,
          userId: finalUserId,
          companyId: user.companyId,
        });

        await refreshAggregatesAfterContractChange(
          tx,
          user.companyId,
          created.customer?.id ?? null,
          created.car?.id ?? null,
        );

        return created;
      });
    }

    // (테스트 등 Prisma 미주입 경로)
    return this.repository.createContract({
      ...createPayload,
      userId: finalUserId,
      companyId: user.companyId,
    });
  }

  /** 계약 수정 (담당자 한정, 문서 연결/파일명 변경 포함, 집계 갱신) */
  async updateContract(user: RequestUser, contractId: number, updatePayload: UpdateContractDto) {
    await this.assertCanModify(user, contractId);

    if (this.prisma) {
      return this.prisma.$transaction(async (tx) => {
        const repo = new ContractRepository(tx);
        const updated = await repo.updateContract(contractId, updatePayload);

        // 계약서(문서) 연결 및 파일명 변경
        if (
          Array.isArray(updatePayload.contractDocuments) &&
          updatePayload.contractDocuments.length
        ) {
          const documentIds = updatePayload.contractDocuments
            .map((d: any) => (typeof d === 'number' ? d : d?.id))
            .filter((id: any): id is number => Number.isInteger(id));

          if (documentIds.length) {
            await ContractService.attachDocumentsToContractTx(
              tx,
              user.companyId,
              contractId,
              documentIds,
            );
          }

          const fileNameUpdates = updatePayload.contractDocuments
            .map((d: any) => {
              const id = typeof d === 'number' ? undefined : d?.id;
              const fileName = typeof d === 'number' ? undefined : d?.fileName;
              return id && fileName ? { id, fileName } : null;
            })
            .filter((v): v is { id: number; fileName: string } => !!v);

          if (fileNameUpdates.length) {
            await ContractService.updateContractDocumentFileNamesTx(
              tx,
              user.companyId,
              contractId,
              fileNameUpdates,
            );
          }
        }

        await refreshAggregatesAfterContractChange(
          tx,
          user.companyId,
          updated.customer?.id ?? null,
          updated.car?.id ?? null,
        );

        return updated;
      });
    }

    // Prisma 미주입 경로(문서 연결/파일명 변경은 생략)
    return this.repository.updateContract(contractId, updatePayload);
  }

  /** 계약 삭제 (담당자 한정) */
  async deleteContract(user: RequestUser, contractId: number) {
    await this.assertCanModify(user, contractId);

    if (this.prisma) {
      await this.prisma.$transaction(async (tx) => {
        const repo = new ContractRepository(tx);
        const before = await repo.findContractById(contractId);

        await repo.deleteContract(contractId);

        await refreshAggregatesAfterContractChange(
          tx,
          user.companyId,
          before?.customer?.id ?? null,
          before?.car?.id ?? null,
        );
      });
      return;
    }

    await this.repository.deleteContract(contractId);
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // 드롭다운 소스
  // ──────────────────────────────────────────────────────────────────────────────

  /** 계약용 차량 선택 목록 (보유중만) */
  async getContractCars(user: RequestUser): Promise<ItemForDropdown[]> {
    const cars = await this.repository.findCarsForContract(user.companyId);
    return cars.map((car) => ({ id: car.id, data: `${car.model}(${car.carNumber})` }));
  }

  /** 계약용 고객 선택 목록 */
  async getContractCustomers(user: RequestUser) {
    return this.repository.findCustomersByCompanyId(user.companyId);
  }

  /** 계약용 사용자 선택 목록 */
  async getContractUsers(user: RequestUser) {
    return this.repository.findUsersByCompanyId(user.companyId);
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // 트랜잭션 헬퍼(정적 메서드: ESLint class-methods-use-this 대응)
  // ──────────────────────────────────────────────────────────────────────────────

  /** 트랜잭션 안에서 문서들을 계약에 연결 */
  private static async attachDocumentsToContractTx(
    tx: Prisma.TransactionClient,
    companyId: number,
    contractId: number,
    documentIds: number[],
  ): Promise<void> {
    if (!documentIds.length) return;
    await tx.contractDocument.updateMany({
      where: { id: { in: documentIds }, contract: { companyId } },
      data: { contractId },
    });
  }

  /** 트랜잭션 안에서 문서 파일명 일괄 변경 */
  private static async updateContractDocumentFileNamesTx(
    tx: Prisma.TransactionClient,
    _companyId: number,
    contractId: number,
    items: { id: number; fileName: string }[],
  ): Promise<void> {
    if (!items.length) return;
    await Promise.all(
      items.map(({ id, fileName }) =>
        tx.contractDocument.update({
          where: { id },
          data: { fileName, contractId },
        }),
      ),
    );
  }
}

export default ContractService;
