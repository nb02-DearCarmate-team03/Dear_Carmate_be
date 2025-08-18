import { Prisma, PrismaClient } from '@prisma/client';
import { FindManyCompanyOptions } from './dto/get-companies.dto';
import { FindManyUserOptions } from './dto/get-users.dto';

export default class CompanyRepository {
  private readonly prisma: PrismaClient | Prisma.TransactionClient;

  constructor(prisma: PrismaClient | Prisma.TransactionClient) {
    this.prisma = prisma;
  }

  async create(data: Prisma.CompanyCreateInput) {
    return this.prisma.company.create({
      data,
      include: {
        _count: {
          select: { users: true },
        },
      },
    });
  }

  async findById(companyId: number) {
    return this.prisma.company.findUnique({
      where: { id: companyId },
    });
  }

  async findByName(companyName: string) {
    return this.prisma.company.findUnique({
      where: { companyName },
    });
  }

  async findByCode(companyCode: string) {
    return this.prisma.company.findUnique({
      where: { companyCode },
    });
  }

  async findManyCompany(options: FindManyCompanyOptions) {
    return this.prisma.company.findMany({
      skip: options.skip ?? 0,
      take: options.take ?? 0,
      where: options.where ?? {},
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: options.orderBy || { id: 'asc' },
    });
  }

  async countCompanies(where?: Prisma.CompanyWhereInput): Promise<number> {
    return this.prisma.company.count({ where });
  }

  async findManyUser(options: FindManyUserOptions) {
    return this.prisma.user.findMany({
      skip: options.skip ?? 0,
      take: options.take ?? 0,
      where: options.where ?? {},
      include: {
        company: {
          select: {
            companyName: true,
          },
        },
      },
      orderBy: options.orderBy || { id: 'asc' },
    });
  }

  async countUsers(where?: Prisma.UserWhereInput): Promise<number> {
    return this.prisma.user.count({ where });
  }

  async updateCompany(companyId: number, data: Prisma.CompanyUpdateInput) {
    return this.prisma.company.update({
      where: { id: companyId },
      data,
      include: {
        _count: {
          select: { users: true },
        },
      },
    });
  }

  async deleteCompany(companyId: number) {
    return this.prisma.company.delete({
      where: { id: companyId },
    });
  }
}
