import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import UserController from './controller';
import UserService from './service';
import UserRepository from './repository';
import validateDto from '../common/utils/validate.dto';
import RegisterDto from './dto/create-user.dto';
import UpdateUserDto from './dto/update-user.dto';
import isAuthenticated from '../middlewares/passport.middlewares';
import { authorizeAdmin } from '../middlewares/auth.middleware';

const userRouter = (prisma: PrismaClient): Router => {
  const router = Router();

  const userRepository = new UserRepository(prisma);
  const userService = new UserService(userRepository);
  const userController = new UserController(userService);

  /**
   * @swagger
   * /users:
   *   post:
   *     tags:
   *       - Users
   *     summary: 회원가입
   *     description: 새로운 사용자 등록
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - email
   *               - employeeNumber
   *               - phoneNumber
   *               - password
   *               - passwordConfirmation
   *               - companyName
   *               - companyCode
   *             properties:
   *               name:
   *                 type: string
   *                 example: "홍길동"
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "hong@example.com"
   *               employeeNumber:
   *                 type: string
   *                 example: "EMP001"
   *               phoneNumber:
   *                 type: string
   *                 example: "010-1234-5678"
   *               password:
   *                 type: string
   *                 format: password
   *                 example: "password123"
   *               passwordConfirmation:
   *                 type: string
   *                 format: password
   *                 example: "password123"
   *               companyName:
   *                 type: string
   *                 example: "ABC Company"
   *               companyCode:
   *                 type: string
   *                 example: "ABC123"
   *     responses:
   *       201:
   *         description: 회원가입 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: integer
   *                 name:
   *                   type: string
   *                 email:
   *                   type: string
   *                 employeeNumber:
   *                   type: string
   *                 phoneNumber:
   *                   type: string
   *                 imageUrl:
   *                   type: string
   *                 isAdmin:
   *                   type: boolean
   *                 company:
   *                   type: object
   *                   properties:
   *                     companyCode:
   *                       type: string
   *       400:
   *         description: 잘못된 요청
   *       409:
   *         description: 이미 존재하는 이메일
   */

  router.post('/', validateDto(RegisterDto), userController.register);

  /**
   * @swagger
   * /users/me:
   *   get:
   *     tags:
   *       - Users
   *     summary: 내 정보 조회
   *     description: 로그인한 사용자의 정보 조회
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 사용자 정보 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: integer
   *                 name:
   *                   type: string
   *                 email:
   *                   type: string
   *                 employeeNumber:
   *                   type: string
   *                 phoneNumber:
   *                   type: string
   *                 imageUrl:
   *                   type: string
   *                 isAdmin:
   *                   type: boolean
   *                 company:
   *                   type: object
   *                   properties:
   *                     companyCode:
   *                       type: string
   *       401:
   *         description: 인증이 필요합니다
   */

  /**
   * @swagger
   * /users/me:
   *   get:
   *     tags:
   *       - Users
   *     summary: 내 정보 조회
   *     description: 로그인한 사용자의 정보 조회
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 사용자 정보 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: integer
   *                 name:
   *                   type: string
   *                 email:
   *                   type: string
   *                 employeeNumber:
   *                   type: string
   *                 phoneNumber:
   *                   type: string
   *                 imageUrl:
   *                   type: string
   *                 isAdmin:
   *                   type: boolean
   *                 company:
   *                   type: object
   *                   properties:
   *                     companyCode:
   *                       type: string
   *       401:
   *         description: 인증이 필요합니다
   */

  router.get('/me', isAuthenticated, userController.getInfo);
  /**
   * @swagger
   * /users/me:
   *   patch:
   *     tags:
   *       - Users
   *     summary: 내 정보 수정
   *     description: 로그인한 사용자의 정보 수정
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               employeeNumber:
   *                 type: string
   *                 example: "EMP002"
   *               phoneNumber:
   *                 type: string
   *                 example: "010-9876-5432"
   *               currentPassword:
   *                 type: string
   *                 format: password
   *               password:
   *                 type: string
   *                 format: password
   *               passwordConfirmation:
   *                 type: string
   *                 format: password
   *               imageUrl:
   *                 type: string
   *     responses:
   *       200:
   *         description: 정보 수정 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: integer
   *                 name:
   *                   type: string
   *                 email:
   *                   type: string
   *                 employeeNumber:
   *                   type: string
   *                 phoneNumber:
   *                   type: string
   *                 imageUrl:
   *                   type: string
   *                 isAdmin:
   *                   type: boolean
   *                 company:
   *                   type: object
   *                   properties:
   *                     companyCode:
   *                       type: string
   *       400:
   *         description: 잘못된 요청
   *       401:
   *         description: 인증이 필요합니다
   */

  /**
   * @swagger
   * /users/me:
   *   patch:
   *     tags:
   *       - Users
   *     summary: 내 정보 수정
   *     description: 로그인한 사용자의 정보 수정
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               employeeNumber:
   *                 type: string
   *                 example: "EMP002"
   *               phoneNumber:
   *                 type: string
   *                 example: "010-9876-5432"
   *               currentPassword:
   *                 type: string
   *                 format: password
   *               password:
   *                 type: string
   *                 format: password
   *               passwordConfirmation:
   *                 type: string
   *                 format: password
   *               imageUrl:
   *                 type: string
   *     responses:
   *       200:
   *         description: 정보 수정 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: integer
   *                 name:
   *                   type: string
   *                 email:
   *                   type: string
   *                 employeeNumber:
   *                   type: string
   *                 phoneNumber:
   *                   type: string
   *                 imageUrl:
   *                   type: string
   *                 isAdmin:
   *                   type: boolean
   *                 company:
   *                   type: object
   *                   properties:
   *                     companyCode:
   *                       type: string
   *       400:
   *         description: 잘못된 요청
   *       401:
   *         description: 인증이 필요합니다
   */

  router.patch('/me', isAuthenticated, validateDto(UpdateUserDto), userController.updateProfile);

  /**
   * @swagger
   * /users/me:
   *   delete:
   *     tags:
   *       - Users
   *     summary: 회원 탈퇴
   *     description: 로그인한 사용자 계정 삭제
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 회원 탈퇴 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "유저 삭제 성공"
   *       401:
   *         description: 인증이 필요합니다
   */

  /**
   * @swagger
   * /users/me:
   *   delete:
   *     tags:
   *       - Users
   *     summary: 회원 탈퇴
   *     description: 로그인한 사용자 계정 삭제
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 회원 탈퇴 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "유저 삭제 성공"
   *       401:
   *         description: 인증이 필요합니다
   */

  router.delete('/me', isAuthenticated, userController.deleteUser);

  /**
   * @swagger
   * /users/{userId}:
   *   delete:
   *     tags:
   *       - Users
   *     summary: 사용자 삭제 (Admin)
   *     description: 특정 사용자 삭제 (관리자 권한 필요)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: integer
   *         description: 삭제할 사용자 ID
   *     responses:
   *       200:
   *         description: 사용자 삭제 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "유저 삭제 성공"
   *       401:
   *         description: 인증이 필요합니다
   *       403:
   *         description: 관리자 권한이 필요합니다
   *       404:
   *         description: 사용자를 찾을 수 없습니다
   */

  /**
   * @swagger
   * /users/{userId}:
   *   delete:
   *     tags:
   *       - Users
   *     summary: 사용자 삭제 (Admin)
   *     description: 특정 사용자 삭제 (관리자 권한 필요)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: integer
   *         description: 삭제할 사용자 ID
   *     responses:
   *       200:
   *         description: 사용자 삭제 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "유저 삭제 성공"
   *       401:
   *         description: 인증이 필요합니다
   *       403:
   *         description: 관리자 권한이 필요합니다
   *       404:
   *         description: 사용자를 찾을 수 없습니다
   */

  router.delete('/:userId', isAuthenticated, authorizeAdmin, userController.deleteUserId);

  return router;
};

export default userRouter;
