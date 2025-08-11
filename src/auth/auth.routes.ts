import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import AuthController from './controller';
import validateDto from '../common/utils/validate.dto';
import { LoginDto } from './dto/login.dto';
import AuthService from './service';
import AuthRepository from './repository';

const authRouter = (prisma: PrismaClient): Router => {
  const router = Router();

  const authRepository = new AuthRepository(prisma);
  const authService = new AuthService(authRepository);
  const authController = new AuthController(authService);

  /**
   * @swagger
   * /auth/login:
   *   post:
   *     tags:
   *       - Auth
   *     summary: 로그인
   *     description: 이메일과 비밀번호로 로그인
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "user@example.com"
   *               password:
   *                 type: string
   *                 format: password
   *                 example: "password123"
   *     responses:
   *       200:
   *         description: 로그인 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 user:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   *                     name:
   *                       type: string
   *                     email:
   *                       type: string
   *                     employeeNumber:
   *                       type: string
   *                     phoneNumber:
   *                       type: string
   *                     isAdmin:
   *                       type: boolean
   *                     imageUrl:
   *                       type: string
   *                     company:
   *                       type: object
   *                       properties:
   *                         companyCode:
   *                           type: string
   *                 accessToken:
   *                   type: string
   *                 refreshToken:
   *                   type: string
   *       401:
   *         description: 인증 실패
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "잘못된 이메일 또는 비밀번호입니다"
   *       404:
   *         description: 사용자를 찾을 수 없음
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "존재하지 않는 사용자입니다"
   */

  router.post('/login', validateDto(LoginDto), authController.login);

  /**
   * @swagger
   * /auth/refresh:
   *   post:
   *     tags:
   *       - Auth
   *     summary: 토큰 갱신
   *     description: Refresh Token을 사용하여 새로운 Access Token 발급
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *             properties:
   *               refreshToken:
   *                 type: string
   *     responses:
   *       200:
   *         description: 토큰 갱신 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 accessToken:
   *                   type: string
   *                 refreshToken:
   *                   type: string
   *       400:
   *         description: 잘못된 요청
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "유효하지 않은 토큰입니다"
   */

  router.post('/refresh', authController.refresh);

  return router;
};

export default authRouter;
