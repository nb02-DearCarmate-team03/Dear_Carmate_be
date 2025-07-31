import { Request, Response, NextFunction } from 'express';
import jwt, { TokenExpiredError, JsonWebTokenError, JwtPayload } from 'jsonwebtoken';

const { JWT_ACCESS_TOKEN_SECRET } = process.env;
if (!JWT_ACCESS_TOKEN_SECRET) {
  throw new Error('JWT_SECRET 환경변수가 설정되지 않았습니다.');
}

export interface User {
  id: number;
  email: string;
  name: string;
  isAdmin: boolean;
  companyId: number;
}
// AuthRequest 인터페이스 추가
export interface AuthRequest extends Request {
  user?: User;
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const { authorization: authHeader } = req.headers;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ message: '인증이 필요합니다.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({ message: '인증 토큰이 없습니다.' });
      return;
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_ACCESS_TOKEN_SECRET) as JwtPayload;
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        res.status(401).json({ message: '토큰이 만료되었습니다.' });
      } else if (err instanceof JsonWebTokenError) {
        res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
      } else {
        res.status(401).json({ message: '인증이 필요합니다.' });
      }
      return;
    }

    const { id, email, name, isAdmin, companyId } = decoded as User;
    if (id && email && name) {
      req.user = { id, email, name, isAdmin, companyId }; // is
      next();
    } else {
      res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    }
  } catch {
    res.status(500).json({ message: '서버 오류' });
  }
};

export const authorizeAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ message: '인증이 필요합니다.' });
    return;
  }
  // 관리자 권한 확인
  if (req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: '관리자 권한이 필요합니다' });
  }
};
