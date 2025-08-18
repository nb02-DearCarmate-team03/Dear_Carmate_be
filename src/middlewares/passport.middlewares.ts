import { Request, Response, NextFunction, RequestHandler } from 'express';
import { User } from '@prisma/client';
import passport from '../auth/passport';

export const isAuthenticated: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  passport.authenticate('jwt', { session: false }, (err: unknown, user: User | false) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ message: '인증이 필요합니다.' });
    }
    req.user = user;
    return next();
  })(req, res, next);
};

export default isAuthenticated;
