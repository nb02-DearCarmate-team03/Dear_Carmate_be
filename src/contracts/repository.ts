import { Prisma, PrismaClient } from '@prisma/client';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

const toDateOrUndef = (v?: string) => (v ? new Date(v) : undefined);

export default class ContractRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma ?? new PrismaClient();
  }

  // 계약 등록
  async create(data: CreateContractDto & { userId: number; companyId: number }) {
    const { meetings, contractDate, ...scalar } = data;

    return this.prisma.contract.create({
      data: {
        ...scalar,
        contractDate: toDateOrUndef(contractDate),

        meetings:
          meetings && meetings.length > 0
            ? ({
                create: meetings.map((m) => ({
                  date: new Date(m.date),
                  alarms:
                    m.alarms && m.alarms.length > 0
                      ? { create: m.alarms.map((a) => ({ time: new Date(a) })) }
                      : undefined,
                })),
              } as Prisma.MeetingCreateNestedManyWithoutContractInput)
            : undefined,
      },
      include: {
        user: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        car: { select: { id: true, model: true } },
        contractDocuments: true,
        meetings: { include: { alarms: true } },
      },
    });
  }

  // 계약 조회
  async findAll(filters: {
    companyId: number;
    searchBy?: 'customerName' | 'userName';
    keyword?: string;
  }) {
    const { companyId, searchBy, keyword } = filters;

    const where: Prisma.ContractWhereInput = { companyId };
    if (keyword && searchBy === 'customerName') {
      where.customer = { name: { contains: keyword, mode: 'insensitive' } };
    } else if (keyword && searchBy === 'userName') {
      where.user = { name: { contains: keyword, mode: 'insensitive' } };
    }

    return this.prisma.contract.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        car: { select: { id: true, model: true } },
        customer: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
        meetings: { include: { alarms: true } },
      },
    });
  }

  async count(where?: Prisma.ContractWhereInput) {
    return this.prisma.contract.count({ where });
  }

  // 계약 단일 조회
  async findById(contractId: number, include?: Prisma.ContractInclude) {
    return this.prisma.contract.findUnique({
      where: { id: contractId },
      include,
    });
  }

  // 계약 수정
  async update(contractId: number, dto: UpdateContractDto) {
    const { contractDate, resolutionDate, ...rest } = dto;

    return this.prisma.contract.update({
      where: { id: contractId },
      data: {
        ...rest,
        contractDate: toDateOrUndef(contractDate),
        resolutionDate: toDateOrUndef(resolutionDate),
      },
    });
  }

  // 계약 삭제
  async delete(contractId: number) {
    return this.prisma.contract.delete({ where: { id: contractId } });
  }

  // 계약 선택 목록 조회
  async findCarsByCompanyId(companyId: number) {
    return this.prisma.car.findMany({
      where: { companyId },
      select: { id: true, model: true, carNumber: true },
      orderBy: { id: 'asc' },
    });
  }

  async findCustomersByCompanyId(companyId: number) {
    return this.prisma.customer.findMany({
      where: { companyId },
      select: { id: true, name: true, email: true },
      orderBy: { id: 'asc' },
    });
  }

  async findUsersByCompanyId(companyId: number) {
    return this.prisma.user.findMany({
      where: { companyId },
      select: { id: true, name: true, email: true },
      orderBy: { id: 'asc' },
    });
  }
}
