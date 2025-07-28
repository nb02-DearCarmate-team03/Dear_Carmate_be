import bcrypt from 'bcrypt';
import { AuthUserPayload } from './dto/login.dto';
import AuthRepository from './repository';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './jwt';

export interface LoginResponse {
  user: {
    id: number;
    name: string;
    email: string;
    employeeNumber: string;
    phoneNumber: string;
    isAdmin: boolean;
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
  static async validateUser(email: string, password: string) {
    const user = await AuthRepository.findByEmail(email);
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    return user;
  }

  /**
   * 로그인 응답 생성 (토큰 생성)
   */
  static async login(user: AuthUserPayload): Promise<LoginResponse> {
    await AuthRepository.updateLastLogin(user.id);

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = signRefreshToken({ sub: user.id });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        employeeNumber: user.employeeNumber,
        phoneNumber: user.phoneNumber,
        isAdmin: user.isAdmin,
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
  static async refreshTokens(refreshToken: string): Promise<LoginResponse> {
    const payload = verifyRefreshToken(refreshToken);
    const userId = Number(payload.sub);

    if (!userId) {
      throw new Error('유효하지 않은 사용자 정보입니다.');
    }

    const user = await AuthRepository.findById(userId);
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    const newAccessToken = signAccessToken({ sub: user.id, email: user.email });
    const newRefreshToken = signRefreshToken({ sub: user.id });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        employeeNumber: user.employeeNumber,
        phoneNumber: user.phoneNumber,
        isAdmin: user.isAdmin,
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
