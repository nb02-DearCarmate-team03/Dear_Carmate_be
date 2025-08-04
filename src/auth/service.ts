import bcrypt from 'bcrypt';
import { AuthUserPayload } from './dto/login.dto';
import AuthRepository from './repository';
import { signAccessToken, signRefreshToken, verifyRefreshToken, RefreshTokenPayload } from './jwt';
import { NotFoundError, UnauthorizedError } from '../middlewares/error.middleware';

export interface LoginResponse {
  user: {
    id: number;
    name: string;
    email: string;
    employeeNumber: string;
    phoneNumber: string;
    isAdmin: boolean;
    imageUrl?: string;
    company: {
      companyCode: string;
    };
  };
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  /**
   * 이메일 + 비밀번호 검증
   */
  private readonly authRepository: AuthRepository;

  constructor(authRepository: AuthRepository) {
    this.authRepository = authRepository;
  }

  async validateUser(email: string, password: string) {
    const user = await this.authRepository.findByEmail(email);
    if (!user) throw new NotFoundError('존재하지 않거나 비밀번호가 일치하지 않습니다.');

    if (!user.isActive) {
      throw new UnauthorizedError('비활성화된 계정입니다.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedError('비밀번호가 일치하지 않습니다.');

    return user;
  }

  /**
   * 로그인 응답 생성 (토큰 생성)
   */
  async login(user: AuthUserPayload): Promise<LoginResponse> {
    await this.authRepository.updateLastLoginAt(user.id);

    const accessToken = signAccessToken({ sub: user.id, email: user.email, isAdmin: user.isAdmin });
    const refreshToken = signRefreshToken({ sub: user.id, isAdmin: user.isAdmin });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        employeeNumber: user.employeeNumber,
        phoneNumber: user.phoneNumber,
        isAdmin: user.isAdmin,
        imageUrl: user.imageUrl ?? undefined,
        company: {
          companyCode: user.company.companyCode,
        },
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * refreshTokens 재발급
   */
  async refreshTokens(refreshToken: string): Promise<LoginResponse> {
    let payload: RefreshTokenPayload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error: unknown) {
      throw new UnauthorizedError('유효하지 않은 Refresh Token입니다.');
    }
    const userId = Number(payload.sub);

    if (!userId) {
      throw new UnauthorizedError('유효하지 않은 사용자 정보입니다.');
    }

    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('사용자를 찾을 수 없습니다.');
    }

    const newAccessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    });
    const newRefreshToken = signRefreshToken({ sub: user.id, isAdmin: user.isAdmin });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        employeeNumber: user.employeeNumber,
        phoneNumber: user.phoneNumber,
        isAdmin: user.isAdmin,
        imageUrl: user.imageUrl ?? undefined,
        company: {
          companyCode: user.company.companyCode,
        },
      },
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}

export default AuthService;
