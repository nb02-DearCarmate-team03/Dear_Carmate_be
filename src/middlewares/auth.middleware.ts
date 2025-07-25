import { Request, Response, NextFunction } from 'express';
import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;
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
  user?: Partial<User>;
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction): void => {
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

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (decoded && decoded.id && decoded.email && decoded.name) {
      req.user = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
      };
      next();
    } else {
      res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    }
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      res.status(401).json({ message: '토큰이 만료되었습니다.' });
    } else if (err instanceof JsonWebTokenError) {
      res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    } else {
      res.status(401).json({ message: '인증이 필요합니다.' });
    }
  }
};
