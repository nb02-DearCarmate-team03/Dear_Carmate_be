import { Request, Response, NextFunction } from 'express';
import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';

const { JWT_SECRET } = process.env;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET 환경변수가 설정되지 않았습니다.');
}

export interface User {
  id: number;
  email: string;
  name: string;
}

export interface JwtPayload {
  id: number;
  email: string;
  name: string;
}

export interface AuthRequest extends Request {
  user?: User;
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: '인증이 필요합니다.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({ message: '인증 토큰이 없습니다.' });
      return;
    }

    let decoded: unknown;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
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

    if (
      typeof decoded === 'object' &&
      decoded !== null &&
      'id' in decoded &&
      'email' in decoded &&
      'name' in decoded
    ) {
      const payload = decoded as JwtPayload;
      req.user = {
        id: payload.id,
        email: payload.email,
        name: payload.name,
      };
      next();
    } else {
      res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    }
  } catch {
    res.status(500).json({ message: '서버 오류' });
  }
};
