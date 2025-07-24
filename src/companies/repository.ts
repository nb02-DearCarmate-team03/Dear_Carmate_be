import { Prisma } from '@prisma/client';
import prisma from '../common/prisma/client';

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
}
