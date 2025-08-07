import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import isAuthenticated from '../auth/auth';
import CompanyController from './controller';
import validateDto from '../common/utils/validate.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CompanyListQueryDto } from './dto/get-companies.dto';
import { UserListQueryDto } from './dto/get-users.dto';
import UpdateCompanyDto from './dto/update-companies.dto';
import { authorizeAdmin } from '../middlewares/auth.middleware';
import CompanyRepository from './repository';
import CompanyService from './service';

const CompaniesRouter = (prisma: PrismaClient): Router => {
  const router = Router();

  const companyRepository = new CompanyRepository(prisma);
  const companyService = new CompanyService(companyRepository);
  const companyController = new CompanyController(companyService);

  router.use(isAuthenticated);
  router.use(authorizeAdmin);

  /**
   * @swagger
   * /api/companies:
   *   post:
   *     tags:
   *       - Companies
   *     summary: 회사 등록 (Admin)
   *     description: 새로운 회사 등록 (관리자 권한 필요)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - companyName
   *               - companyCode
   *             properties:
   *               companyName:
   *                 type: string
   *                 example: "ABC Company"
   *               companyCode:
   *                 type: string
   *                 example: "ABC123"
   *     responses:
   *       201:
   *         description: 회사 등록 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: integer
   *                 companyName:
   *                   type: string
   *                 companyCode:
   *                   type: string
   *                 userCount:
   *                   type: integer
   *       400:
   *         description: 잘못된 요청
   *       401:
   *         description: 인증이 필요합니다
   *       403:
   *         description: 관리자 권한이 필요합니다
   */

  router.post('/', validateDto(CreateCompanyDto), companyController.registerCompany);

  /**
   * @swagger
   * /api/companies:
   *   get:
   *     tags:
   *       - Companies
   *     summary: 회사 목록 조회 (Admin)
   *     description: 등록된 회사 목록 조회 (관리자 권한 필요)
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
   *           enum: [companyName, companyCode]
   *         description: 검색 기준
   *       - in: query
   *         name: keyword
   *         schema:
   *           type: string
   *         description: 검색 키워드
   *     responses:
   *       200:
   *         description: 회사 목록 조회 성공
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
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: integer
   *                       companyName:
   *                         type: string
   *                       companyCode:
   *                         type: string
   *                       userCount:
   *                         type: integer
   *       401:
   *         description: 인증이 필요합니다
   *       403:
   *         description: 관리자 권한이 필요합니다
   */

  router.get('/', validateDto(CompanyListQueryDto), companyController.getCompanyList);

  /**
   * @swagger
   * /api/companies/users:
   *   get:
   *     tags:
   *       - Companies
   *     summary: 회사별 유저 목록 조회 (Admin)
   *     description: 회사별 유저 목록 조회 (관리자 권한 필요)
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
   *           enum: [companyName, name, email]
   *         description: 검색 기준
   *       - in: query
   *         name: keyword
   *         schema:
   *           type: string
   *         description: 검색 키워드
   *     responses:
   *       200:
   *         description: 유저 목록 조회 성공
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
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: integer
   *                       name:
   *                         type: string
   *                       email:
   *                         type: string
   *                       employeeNumber:
   *                         type: string
   *                       phoneNumber:
   *                         type: string
   *                       company:
   *                         type: object
   *                         properties:
   *                           companyName:
   *                             type: string
   *       401:
   *         description: 인증이 필요합니다
   *       403:
   *         description: 관리자 권한이 필요합니다
   */

  router.get('/users', validateDto(UserListQueryDto), companyController.getUserList);

  /**
   * @swagger
   * /api/companies/{companyId}:
   *   patch:
   *     tags:
   *       - Companies
   *     summary: 회사 정보 수정 (Admin)
   *     description: 회사 정보 수정 (관리자 권한 필요)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: companyId
   *         required: true
   *         schema:
   *           type: integer
   *         description: 수정할 회사 ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               companyName:
   *                 type: string
   *               companyCode:
   *                 type: string
   *     responses:
   *       200:
   *         description: 회사 정보 수정 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: integer
   *                 companyName:
   *                   type: string
   *                 companyCode:
   *                   type: string
   *                 userCount:
   *                   type: integer
   *       400:
   *         description: 잘못된 요청
   *       401:
   *         description: 인증이 필요합니다
   *       403:
   *         description: 관리자 권한이 필요합니다
   *       404:
   *         description: 회사를 찾을 수 없습니다
   */

  router.patch('/:companyId', validateDto(UpdateCompanyDto), companyController.updateCompany);

  /**
   * @swagger
   * /api/companies/{companyId}:
   *   delete:
   *     tags:
   *       - Companies
   *     summary: 회사 삭제 (Admin)
   *     description: 회사 삭제 (관리자 권한 필요)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: companyId
   *         required: true
   *         schema:
   *           type: integer
   *         description: 삭제할 회사 ID
   *     responses:
   *       200:
   *         description: 회사 삭제 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "회사 삭제 성공"
   *       401:
   *         description: 인증이 필요합니다
   *       403:
   *         description: 관리자 권한이 필요합니다
   *       404:
   *         description: 회사를 찾을 수 없습니다
   */

  router.delete('/:companyId', companyController.deleteCompany);

  return router;
};

export default CompaniesRouter;
