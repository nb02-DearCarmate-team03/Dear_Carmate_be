import jwt, { JwtPayload } from 'jsonwebtoken';
import { JWT_ACCESS_TOKEN_SECRET, JWT_REFRESH_TOKEN_SECRET } from '../common/constants/constants';

if (!JWT_ACCESS_TOKEN_SECRET || !JWT_REFRESH_TOKEN_SECRET) {
  throw new Error('JWT 시크릿이 설정되지 않았습니다.');
}
export interface RefreshTokenPayload extends JwtPayload {
  sub: string;
  isAdmin: boolean;
}

export const signAccessToken = (payload: {
  sub: number;
  email: string;
  isAdmin: boolean;
}): string => {
  return jwt.sign({ ...payload, sub: payload.sub.toString() }, JWT_ACCESS_TOKEN_SECRET, {
    expiresIn: '15m',
  });
};

export const signRefreshToken = (payload: { sub: number; isAdmin: boolean }): string => {
  return jwt.sign({ ...payload, sub: payload.sub.toString() }, JWT_REFRESH_TOKEN_SECRET, {
    expiresIn: '7d',
  });
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, JWT_REFRESH_TOKEN_SECRET) as RefreshTokenPayload;
};
