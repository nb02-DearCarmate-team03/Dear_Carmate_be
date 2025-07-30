import type { User as PrismaUser } from '@prisma/client';

type AuthUser = Pick<
  PrismaUser,
  | 'id'
  | 'companyId'
  | 'name'
  | 'email'
  | 'employeeNumber'
  | 'phoneNumber'
  | 'isAdmin'
  | 'imageUrl'
  | 'isActive'
  | 'lastLoginAt'
  | 'createdAt'
  | 'updatedAt'
>;

declare global {
  namespace Express {
    interface User extends Partial<AuthUser> {
      id: number;
      email: string;
      name: string;
      isAdmin: boolean;
      companyId: number;
    }

    interface Request {
      user?: User;
      cookies: {
        accessToken?: string;
        refreshToken?: string;
      };
    }
  }
}
