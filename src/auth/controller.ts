import { Request, Response, NextFunction } from 'express';
import AuthService, { LoginResponse } from './service';
import { LoginDto } from './dto/login.dto';
import { BadRequestError } from '../middlewares/error.middleware';

class AuthController {
  private readonly authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  login = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { email, password } = req.body as LoginDto;
      const user = await this.authService.validateUser(email, password);

      if (!user) {
        return res.status(401).json({ message: '인증이 필요합니다.' });
      }

      const loginResponse: LoginResponse = await this.authService.login(user);

      res.cookie('accessToken', loginResponse.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refreshToken', loginResponse.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json(loginResponse);
    } catch (error: unknown) {
      return next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const refreshToken: string = req.cookies?.refreshToken;

      if (!refreshToken) {
        throw new BadRequestError('RefreshToken이 존재하지 않습니다.');
      }

      const loginResponse: LoginResponse = await this.authService.refreshTokens(refreshToken);

      res.cookie('accessToken', loginResponse.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refreshToken', loginResponse.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        accessToken: loginResponse.accessToken,
        refreshToken: loginResponse.refreshToken,
      });
    } catch (error: unknown) {
      return next(error);
    }
  };

  // eslint-disable-next-line class-methods-use-this
  logout = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    if (!req.user) {
      return res.status(401).json({ message: '인증되지 않은 사용자입니다.' });
    }
    /**
     * 로그아웃시 쿠키 제거
     */
    try {
      res.clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      });
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      });
      return res.status(200).json({ message: '로그아웃 되었습니다.' });
    } catch (error: unknown) {
      return next(error);
    }
  };
}

export default AuthController;
