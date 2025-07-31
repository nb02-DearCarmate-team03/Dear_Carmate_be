import { PrismaClient, Prisma } from '@prisma/client';
import { RegisterResponse } from './dto/create-user.dto';

export interface CreateUserInput {
  name: string;
  email: string;
  employeeNumber: string;
  phoneNumber: string;
  password: string;
  imageUrl?: string;
  companyId: number;
}

class UserRepository {
  private readonly prisma: PrismaClient | Prisma.TransactionClient;
  constructor(prisma: PrismaClient | Prisma.TransactionClient) {
    this.prisma = prisma;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findCompanyByNameAndCode(companyName: string, companyCode: string) {
    return this.prisma.company.findUnique({
      where: { companyName, companyCode },
    });
  }

  async createUser(data: CreateUserInput): Promise<RegisterResponse> {
    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        employeeNumber: data.employeeNumber,
        phoneNumber: data.phoneNumber,
        password: data.password,
        company: {
          connect: { id: data.companyId },
        },
      },
      include: {
        company: {
          select: {
            companyCode: true,
          },
        },
      },
    });
  }

  async findWithCompanyByUserId(userId: number) {
    return this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        company: {
          select: {
            companyCode: true,
          },
        },
      },
    });
  }

  async updateUser(
    userId: number,
    data: Partial<CreateUserInput> & { password?: string },
  ): Promise<RegisterResponse> {
    const { employeeNumber, phoneNumber, imageUrl, password } = data;

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(employeeNumber && { employeeNumber }),
        ...(phoneNumber && { phoneNumber }),
        ...(imageUrl && { imageUrl }),
        ...(password && { password }),
      },
      include: {
        company: {
          select: {
            companyCode: true,
          },
        },
      },
    });
  }

  async deleteUser(userId: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

export default UserRepository;
