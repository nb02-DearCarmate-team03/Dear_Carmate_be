import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { CustomerController } from './controller';
import validateDto from '../common/utils/validate.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { isAuthenticated } from '../auth/auth';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Gender:
 *       type: string
 *       enum:
 *         - male
 *         - female
 *     AgeGroup:
 *       type: string
 *       enum:
 *         - 10대
 *         - 20대
 *         - 30대
 *         - 40대
 *         - 50대
 *         - 60대
 *         - 70대
 *         - 80대
 *     Region:
 *       type: string
 *       enum:
 *         - 서울
 *         - 경기
 *         - 인천
 *         - 강원
 *         - 충북
 *         - 충남
 *         - 세종
 *         - 대전
 *         - 전북
 *         - 전남
 *         - 광주
 *         - 경북
 *         - 경남
 *         - 대구
 *         - 울산
 *         - 부산
 *         - 제주
 */

const createCustomerRoutes = (prisma: PrismaClient): Router => {
  const router = Router();
  const customerController = new CustomerController(prisma);

  // 모든 라우트에 인증 미들웨어 적용
  router.use(isAuthenticated);

  /**
   * @swagger
   * /api/customers:
   *   post:
   *     tags:
   *       - Customers
   *     summary: 고객 등록
   *     description: 새로운 고객 정보 등록
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - gender
   *               - phoneNumber
   *               - email
   *             properties:
   *               name:
   *                 type: string
   *                 example: "김철수"
   *               gender:
   *                 $ref: '#/components/schemas/Gender'
   *               phoneNumber:
   *                 type: string
   *                 example: "010-1234-5678"
   *               ageGroup:
   *                 $ref: '#/components/schemas/AgeGroup'
   *               region:
   *                 $ref: '#/components/schemas/Region'
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "kim@example.com"
   *               memo:
   *                 type: string
   *                 example: "VIP 고객"
   *     responses:
   *       201:
   *         description: 고객 등록 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: integer
   *                 name:
   *                   type: string
   *                 gender:
   *                   $ref: '#/components/schemas/Gender'
   *                 phoneNumber:
   *                   type: string
   *                 ageGroup:
   *                   $ref: '#/components/schemas/AgeGroup'
   *                 region:
   *                   $ref: '#/components/schemas/Region'
   *                 email:
   *                   type: string
   *                 memo:
   *                   type: string
   *                 contractCount:
   *                   type: integer
   *       400:
   *         description: 잘못된 요청
   *       401:
   *         description: 인증이 필요합니다
   */

  // 고객 등록
  router.post('/', validateDto(CreateCustomerDto), customerController.createCustomer);

  /**
   * @swagger
   * /api/customers:
   *   get:
   *     tags:
   *       - Customers
   *     summary: 고객 목록 조회
   *     description: 등록된 고객 목록 조회
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: 페이지 번호
   *       - in: query
   *         name: pageSize
   *         schema:
   *           type: integer
   *           default: 8
   *         description: 페이지당 아이템 수
   *       - in: query
   *         name: searchBy
   *         schema:
   *           type: string
   *           enum: [name, email]
   *         description: 검색 기준
   *       - in: query
   *         name: keyword
   *         schema:
   *           type: string
   *         description: 검색 키워드
   *     responses:
   *       200:
   *         description: 고객 목록 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 currentPage:
   *                   type: integer
   *                 totalPages:
   *                   type: integer
   *                 totalItemCount:
   *                   type: integer
   *                 customers:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: integer
   *                       name:
   *                         type: string
   *                       gender:
   *                         $ref: '#/components/schemas/Gender'
   *                       phoneNumber:
   *                         type: string
   *                       ageGroup:
   *                         $ref: '#/components/schemas/AgeGroup'
   *                       region:
   *                         $ref: '#/components/schemas/Region'
   *                       email:
   *                         type: string
   *                       memo:
   *                         type: string
   *                       contractCount:
   *                         type: integer
   *       401:
   *         description: 인증이 필요합니다
   */

  // 고객 목록 조회
  router.get('/', customerController.getCustomerList);

  /**
   * @swagger
   * /api/customers/{customerId}:
   *   get:
   *     tags:
   *       - Customers
   *     summary: 고객 상세 조회
   *     description: 특정 고객의 상세 정보 조회
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: customerId
   *         required: true
   *         schema:
   *           type: integer
   *         description: 조회할 고객 ID
   *     responses:
   *       200:
   *         description: 고객 상세 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: integer
   *                 name:
   *                   type: string
   *                 gender:
   *                   $ref: '#/components/schemas/Gender'
   *                 phoneNumber:
   *                   type: string
   *                 ageGroup:
   *                   $ref: '#/components/schemas/AgeGroup'
   *                 region:
   *                   $ref: '#/components/schemas/Region'
   *                 email:
   *                   type: string
   *                 memo:
   *                   type: string
   *                 contractCount:
   *                   type: integer
   *       401:
   *         description: 인증이 필요합니다
   *       404:
   *         description: 고객을 찾을 수 없습니다
   */

  // 고객 상세 정보 조회
  router.get('/:customerId', customerController.getCustomerById);

  /**
   * @swagger
   * /api/customers/{customerId}:
   *   patch:
   *     tags:
   *       - Customers
   *     summary: 고객 정보 수정
   *     description: 고객 정보 수정
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: customerId
   *         required: true
   *         schema:
   *           type: integer
   *         description: 수정할 고객 ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               gender:
   *                 $ref: '#/components/schemas/Gender'
   *               phoneNumber:
   *                 type: string
   *               ageGroup:
   *                 $ref: '#/components/schemas/AgeGroup'
   *               region:
   *                 $ref: '#/components/schemas/Region'
   *               email:
   *                 type: string
   *                 format: email
   *               memo:
   *                 type: string
   *     responses:
   *       200:
   *         description: 고객 정보 수정 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: integer
   *                 name:
   *                   type: string
   *                 gender:
   *                   $ref: '#/components/schemas/Gender'
   *                 phoneNumber:
   *                   type: string
   *                 ageGroup:
   *                   $ref: '#/components/schemas/AgeGroup'
   *                 region:
   *                   $ref: '#/components/schemas/Region'
   *                 email:
   *                   type: string
   *                 memo:
   *                   type: string
   *                 contractCount:
   *                   type: integer
   *       400:
   *         description: 잘못된 요청
   *       401:
   *         description: 인증이 필요합니다
   *       404:
   *         description: 고객을 찾을 수 없습니다
   */

  // 고객 수정
  router.patch('/:customerId', validateDto(UpdateCustomerDto), customerController.updateCustomer);

  /**
   * @swagger
   * /api/customers/{customerId}:
   *   delete:
   *     tags:
   *       - Customers
   *     summary: 고객 삭제
   *     description: 고객 정보 삭제
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: customerId
   *         required: true
   *         schema:
   *           type: integer
   *         description: 삭제할 고객 ID
   *     responses:
   *       200:
   *         description: 고객 삭제 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "고객 삭제 성공"
   *       401:
   *         description: 인증이 필요합니다
   *       404:
   *         description: 고객을 찾을 수 없습니다
   */

  // 고객 삭제
  router.delete('/:customerId', customerController.deleteCustomer);

  /**
   * @swagger
   * /api/customers/upload:
   *   post:
   *     tags:
   *       - Customers
   *     summary: 고객 대용량 업로드
   *     description: CSV 파일을 통한 고객 정보 대용량 등록
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - file
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *                 description: CSV 파일 (최대 10MB)
   *     responses:
   *       200:
   *         description: 고객 업로드 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "업로드가 완료되었습니다."
   *       400:
   *         description: 잘못된 요청
   *       401:
   *         description: 인증이 필요합니다
   */

  // 고객 대용량 업로드
  router.post('/upload', upload.single('file'), customerController.uploadCustomers);

  return router;
};

export default createCustomerRoutes;
