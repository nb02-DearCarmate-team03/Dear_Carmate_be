import { Prisma } from '@prisma/client';
import prisma from '../common/prisma/client';
import { FindManyCompanyOptions } from './dto/get-company.dto';

export default class CompanyRepository {
  static async create(data: Prisma.CompanyCreateInput) {
    return prisma.company.create({
      data,
    });
  }

  static async findByName(companyName: string) {
    return prisma.company.findUnique({
      where: { companyName },
    });
  }

  static async findByCode(companyCode: string) {
    return prisma.company.findUnique({
      where: { companyCode },
    });
  }

  static async findManyCompany(options: FindManyCompanyOptions) {
    return prisma.company.findMany({
      skip: options.skip,
      take: options.take,
      where: options.where,
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: options.orderBy || { id: 'asc' },
    });
  }

  static async countAllCompanies(where?: Prisma.CompanyWhereInput): Promise<number> {
    return prisma.company.count({ where });
  }
}
