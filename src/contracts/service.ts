import { PrismaClient, ContractStatus as PrismaContractStatus } from '@prisma/client';
import ContractRepository, { ContractSearchBy, ContractWithRelations } from './repository';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { mapContract } from './contract.mapper';
// 계약서 관리를 위한 import 추가
import ContractDocumentsService from '../contract-documents/service';
import ContractDocumentsRepository from '../contract-documents/repository';

type RequestUser = {
  id: number;
  companyId: number;
  name: string;
  email: string;
  isAdmin: boolean;
};

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
  private readonly contractDocumentsService: ContractDocumentsService; //  계약서 서비스 추가
  constructor(prismaOrRepository: PrismaClient | ContractRepository) {
    this.repository =
      prismaOrRepository instanceof ContractRepository
        ? prismaOrRepository
        : new ContractRepository(prismaOrRepository);
    //  계약서 서비스 초기화
    const prisma =
      prismaOrRepository instanceof ContractRepository
        ? (prismaOrRepository as any).prisma
        : prismaOrRepository;
    const contractDocumentsRepo = new ContractDocumentsRepository(prisma);
    this.contractDocumentsService = new ContractDocumentsService(contractDocumentsRepo);
  }

  // 계약 목록 조회(단순)
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

  // 계약 목록 조회(페이지네이션, 단순 리스트)
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

  // 계약 목록 조회(상태별 그룹 + 페이지네이션 요약)
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

    const grouped: {
      carInspection: { totalItemCount: number; data: ReturnType<typeof mapContract>[] };
      priceNegotiation: { totalItemCount: number; data: ReturnType<typeof mapContract>[] };
      contractDraft: { totalItemCount: number; data: ReturnType<typeof mapContract>[] };
      contractSuccessful: { totalItemCount: number; data: ReturnType<typeof mapContract>[] };
      contractFailed: { totalItemCount: number; data: ReturnType<typeof mapContract>[] };
    } = {
      carInspection: { totalItemCount: 0, data: [] },
      priceNegotiation: { totalItemCount: 0, data: [] },
      contractDraft: { totalItemCount: 0, data: [] },
      contractSuccessful: { totalItemCount: 0, data: [] },
      contractFailed: { totalItemCount: 0, data: [] },
    };

    statuses.forEach((status, index) => {
      const count = rest[index * 2] as number;
      const rows = rest[index * 2 + 1] as ContractWithRelations[];
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

  // 계약 단건 조회
  async getContractById(contractId: number) {
    return this.repository.findContractById(contractId);
  }

  // 계약 등록
  async createContract(
    user: RequestUser,
    dto: CreateContractDto & { customerId: number; carId: number; userId: number },
  ) {
    const userId = dto.userId ?? user.id;
    return this.repository.createContract({
      ...dto,
      userId,
      companyId: user.companyId,
    });
  }

  // 계약 수정 - 계약서 관리 통합
  async updateContract(_user: RequestUser, contractId: number, updateData: UpdateContractDto) {
    // 1. 기존 계약 수정 로직 먼저 실행
    const updated = await this.repository.updateContract(contractId, updateData);

    // 2. 계약서 처리 (UpdateContractDto의 contractDocuments 필드 사용)
    if (updateData.contractDocuments && updateData.contractDocuments.length > 0) {
      const documentIds = updateData.contractDocuments.map((doc) => doc.id);

      // 계약서들을 이 계약에 연결
      await this.contractDocumentsService.attachDocumentsToContract(
        _user.companyId,
        contractId,
        documentIds,
      );

      // 파일명 업데이트 (필요한 경우)
      const fileNameUpdates = updateData.contractDocuments
        .filter((doc) => doc.fileName)
        .map((doc) => ({ id: doc.id, fileName: doc.fileName! }));

      if (fileNameUpdates.length > 0) {
        await this.contractDocumentsService.updateContractDocumentFileNames(
          _user.companyId,
          contractId,
          fileNameUpdates,
        );
      }
    }

    return updated;
  }

  // 계약 삭제
  async deleteContract(_user: RequestUser, contractId: number) {
    await this.repository.deleteContract(contractId);
  }

  // 계약용 차량 선택 목록
  async getContractCars(user: RequestUser) {
    return this.repository.findCarsByCompanyId(user.companyId);
  }

  // 계약용 고객 선택 목록
  async getContractCustomers(user: RequestUser) {
    return this.repository.findCustomersByCompanyId(user.companyId);
  }

  // 계약용 사용자 선택 목록
  async getContractUsers(user: RequestUser) {
    return this.repository.findUsersByCompanyId(user.companyId);
  }
}
