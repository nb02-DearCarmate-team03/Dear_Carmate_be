/* eslint-disable no-useless-constructor, no-empty-function */
import { PrismaClient, Customer, Prisma } from '@prisma/client';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

export class CustomerRepository {
  constructor(private readonly prisma: PrismaClient | Prisma.TransactionClient) {}

  async create(companyId: number, data: CreateCustomerDto): Promise<Customer> {
    return this.prisma.customer.create({
      data: {
        ...data,
        companyId,
      },
    });
  }

  async findById(companyId: number, customerId: number): Promise<Customer | null> {
    return this.prisma.customer.findFirst({
      where: {
        id: customerId,
        companyId,
        deletedAt: null,
      },
    });
  }

  async findMany(
    companyId: number,
    page: number,
    pageSize: number,
    searchBy?: string,
    keyword?: string,
  ): Promise<{ customers: Customer[]; total: number }> {
    const skip = (page - 1) * pageSize;

    const where: Prisma.CustomerWhereInput = {
      companyId,
      deletedAt: null,
      ...(searchBy && {
        OR: [
          { name: { contains: searchBy, mode: 'insensitive' } },
          { email: { contains: searchBy, mode: 'insensitive' } },
        ],
      }),
    };

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { customers, total };
  }

  async update(companyId: number, customerId: number, data: UpdateCustomerDto): Promise<Customer> {
    return this.prisma.customer.update({
      where: {
        id: customerId,
        companyId,
        deletedAt: null,
      },
      data,
    });
  }

  async softDelete(companyId: number, customerId: number): Promise<Customer> {
    return this.prisma.customer.update({
      where: {
        id: customerId,
        companyId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async createMany(
    companyId: number,
    customers: CreateCustomerDto[],
  ): Promise<Prisma.BatchPayload> {
    const data = customers.map((customer) => ({
      ...customer,
      companyId,
    }));

    return this.prisma.customer.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async existsByEmail(companyId: number, email: string, excludeId?: number): Promise<boolean> {
    const customer = await this.prisma.customer.findFirst({
      where: {
        email,
        companyId,
        deletedAt: null,
        ...(excludeId && { NOT: { id: excludeId } }),
      },
    });

    return !!customer;
  }

  async existsByPhoneNumber(
    companyId: number,
    phoneNumber: string,
    excludeId?: number,
  ): Promise<boolean> {
    const customer = await this.prisma.customer.findFirst({
      where: {
        phoneNumber,
        companyId,
        deletedAt: null,
        ...(excludeId && { NOT: { id: excludeId } }),
      },
    });

    return !!customer;
  }
}
