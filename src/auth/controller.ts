import { Request, Response, NextFunction } from 'express';
import AuthService, { LoginResponse } from './service';
import { LoginDto } from './dto/login.dto';

class AuthController {
  static async login(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { email, password } = req.body as LoginDto;
      const user = await AuthService.validateUser(email, password);

      if (!user) {
        return res.status(401).json({ message: '인증이 필요합니다.' });
      }

      const loginResponse: LoginResponse = await AuthService.login(user);

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
  }

  static async refresh(req: Request, res: Response): Promise<Response | void> {
    try {
      const refreshToken: string = req.cookies?.refreshToken;

      if (!refreshToken) {
        return res.status(400).json({ message: '잘못된 요청입니다' });
      }

      const loginResponse: LoginResponse = await AuthService.refreshTokens(refreshToken);

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
    } catch (error) {
      return res.status(400).json({ message: error.message || '토큰 재발급 실패' });
    }
  }
}

export default AuthController;
