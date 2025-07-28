import { User, Company } from '@prisma/client';
import prisma from '../common/prisma/client';

export type UserAndCompany = User & {
  company: Pick<Company, 'companyCode'>;
};

class AuthRepository {
  static async findByEmail(email: string): Promise<UserAndCompany | null> {
    return prisma.user.findUnique({
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

  static async findById(id: number): Promise<UserAndCompany | null> {
    return prisma.user.findUnique({
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

  static async updateLastLogin(userId: number): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }
}

export default AuthRepository;
