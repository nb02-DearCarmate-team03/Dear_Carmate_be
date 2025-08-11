import type { User as PrismaUser } from '@prisma/client';

import ContractRepository from './repository';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

import { ForbiddenError } from '../common/errors/forbidden-error';
import { NotFoundError } from '../common/errors/not-found-error';

export type RequestUser = Pick<PrismaUser, 'id' | 'companyId' | 'name' | 'email' | 'isAdmin'>;

export type GetContractsFilters = {
  searchBy?: 'customerName' | 'userName';
  keyword?: string;
};

export class ContractService {
  private readonly contractRepository: ContractRepository;

  constructor(contractRepository: ContractRepository) {
    this.contractRepository = contractRepository;
  }

  // 계약 등록
  async createContract(user: RequestUser, dto: CreateContractDto) {
    return this.contractRepository.create({
      ...dto,
      userId: user.id,
      companyId: user.companyId,
    });
  }

  // 계약 목록 조회
  async getContracts(user: RequestUser, filters: GetContractsFilters) {
    return this.contractRepository.findAll({
      ...filters,
      companyId: user.companyId,
    });
  }

  // 계약 수정
  async updateContract(user: RequestUser, contractId: number, dto: UpdateContractDto) {
    const contract = await this.contractRepository.findById(contractId);
    if (!contract) throw new NotFoundError('존재하지 않는 계약입니다.');
    if (contract.companyId !== user.companyId)
      throw new ForbiddenError('담당자만 수정이 가능합니다.');
    return this.contractRepository.update(contractId, dto);
  }

  // 계약 삭제
  async deleteContract(user: RequestUser, contractId: number) {
    const contract = await this.contractRepository.findById(contractId);
    if (!contract) throw new NotFoundError('존재하지 않는 계약입니다.');
    if (contract.companyId !== user.companyId)
      throw new ForbiddenError('담당자만 삭제가 가능합니다.');
    await this.contractRepository.delete(contractId);
  }

  // 계약용 선택 리스트
  async getContractCars(user: RequestUser) {
    return this.contractRepository.findCarsByCompanyId(user.companyId);
  }

  async getContractCustomers(user: RequestUser) {
    return this.contractRepository.findCustomersByCompanyId(user.companyId);
  }

  async getContractUsers(user: RequestUser) {
    return this.contractRepository.findUsersByCompanyId(user.companyId);
  }
}
