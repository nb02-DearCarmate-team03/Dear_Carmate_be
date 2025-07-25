import prisma from '../common/prisma/client';
import { RegisterResponse } from './dto/create-user.dto';

export interface CreateUserInput {
  name: string;
  email: string;
  employeeNumber: string;
  phoneNumber: string;
  password: string;
  companyId: number;
}

class UserRepository {
  static async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  static async findCompanyByNameAndCode(companyName: string, companyCode: string) {
    return prisma.company.findFirst({
      where: { companyName, companyCode },
    });
  }

  static async createUser(data: CreateUserInput): Promise<RegisterResponse> {
    return prisma.user.create({
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
}

export default UserRepository;
