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
    interface User extends AuthUser {
      password: string;
      refreshToken?: string;
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
