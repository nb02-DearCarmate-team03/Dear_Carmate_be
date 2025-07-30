import { User, Company, PrismaClient, Prisma } from '@prisma/client';

export type UserAndCompany = User & {
  company: Pick<Company, 'companyCode'>;
};

class AuthRepository {
  private readonly prisma: PrismaClient | Prisma.TransactionClient;
  constructor(prisma: PrismaClient | Prisma.TransactionClient) {
    this.prisma = prisma;
  }

  async findByEmail(email: string): Promise<UserAndCompany | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        company: {
          select: {
            companyCode: true,
          },
        },
      },
    });
  }

  async findById(id: number): Promise<UserAndCompany | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            companyCode: true,
          },
        },
      },
    });
  }

  async updateLastLoginAt(userId: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }
}

export default AuthRepository;
