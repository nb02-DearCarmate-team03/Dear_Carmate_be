// eslint-disable-next-line import/no-extraneous-dependencies
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt, VerifiedCallback } from 'passport-jwt';
import bcrypt from 'bcrypt';
import { Request } from 'express';
import AuthRepository from './repository';
import { JWT_ACCESS_TOKEN_SECRET } from '../common/constants/constants';

if (!JWT_ACCESS_TOKEN_SECRET) {
  throw new Error('JWT_SECRET 환경변수가 설정되지 않았습니다.');
}

interface JwtPayload {
  sub: number;
  email: string;
  iat?: number;
  exp?: number;
}

// Local 전략: 로그인 시 유저 검증
passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done): Promise<void> => {
      try {
        const user = await AuthRepository.findByEmail(email);
        if (!user) return done(null, false, { message: '존재하지 않는 이메일입니다.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return done(null, false, { message: '비밀번호가 일치하지 않습니다.' });

        return done(null, user);
      } catch (error: unknown) {
        return done(error);
      }
    },
  ),
);

// JWT 전략: 쿠키에서 accessToken 추출 및 유저 인증
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request): string | null => req?.cookies?.accessToken || null,
        ExtractJwt.fromAuthHeaderAsBearerToken(), // 헤더에서도 추출하도록 설정
      ]),
      secretOrKey: JWT_ACCESS_TOKEN_SECRET,
    },
    async (payload: JwtPayload, done: VerifiedCallback): Promise<void> => {
      try {
        const user = await AuthRepository.findById(payload.sub);
        if (!user) return done(null, false);
        return done(null, user);
      } catch (error: unknown) {
        return done(error, false);
      }
    },
  ),
);

export default passport;
