import { Prisma } from '@prisma/client';
import prisma from '../common/prisma/client';
import { FindManyCompanyOptions } from './dto/get-companies.dto';
import { FindManyUserOptions } from './dto/get-users.dto';

export default class CompanyRepository {
  static async create(data: Prisma.CompanyCreateInput) {
    return prisma.company.create({
      data,
    });
  }

  static async findById(companyId: number) {
    return prisma.company.findUnique({
      where: { id: companyId },
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

  static async countCompanies(where?: Prisma.CompanyWhereInput): Promise<number> {
    return prisma.company.count({ where });
  }

  static async findManyUser(options: FindManyUserOptions) {
    return prisma.user.findMany({
      skip: options.skip,
      take: options.take,
      where: options.where,
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

  static async countUsers(where?: Prisma.UserWhereInput): Promise<number> {
    return prisma.user.count({ where });
  }

  static async updateCompany(companyId: number, data: Prisma.CompanyUpdateInput) {
    return prisma.company.update({
      where: { id: companyId },
      data,
      include: {
        _count: {
          select: { users: true },
        },
      },
    });
  }

  static async deleteCompany(companyId: number) {
    return prisma.company.delete({
      where: { id: companyId },
    });
  }
}
