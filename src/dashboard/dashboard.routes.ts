import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { DashboardRepository } from './repository';
import { DashboardService } from './service';
import { DashboardController } from './controller';
import isAuthenticated from '../middlewares/passport.middlewares';

/**
 * @swagger
 * components:
 *   schemas:
 *     CarTypeForDashboard:
 *       type: string
 *       enum:
 *         - 경·소형
 *         - 준중·중형
 *         - 대형
 *         - 스포츠카
 *         - SUV
 */

export const dashboardRouter = (prisma: PrismaClient): Router => {
  const router = Router();

  const dashboardRepository = new DashboardRepository(prisma);
  const dashboardService = new DashboardService(dashboardRepository);
  const dashboardController = new DashboardController(dashboardService);

  /**
   * @swagger
   * /dashboard:
   *   get:
   *     tags:
   *       - Dashboard
   *     summary: 대시보드 통계 조회
   *     description: 대시보드 요약 통계 정보 조회
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 대시보드 통계 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 monthlySales:
   *                   type: number
   *                   description: 이번 달 매출액
   *                   example: 150000000
   *                 lastMonthSales:
   *                   type: number
   *                   description: 지난 달 매출액
   *                   example: 120000000
   *                 growthRate:
   *                   type: number
   *                   description: 성장률 (%)
   *                   example: 25.0
   *                 proceedingContractsCount:
   *                   type: integer
   *                   description: 진행 중인 계약 수
   *                   example: 15
   *                 completedContractsCount:
   *                   type: integer
   *                   description: 완료된 계약 수
   *                   example: 45
   *                 contractsByCarType:
   *                   type: array
   *                   description: 차종별 계약 현황
   *                   items:
   *                     type: object
   *                     properties:
   *                       carType:
   *                         $ref: '#/components/schemas/CarTypeForDashboard'
   *                       count:
   *                         type: integer
   *                         example: 10
   *                 salesByCarType:
   *                   type: array
   *                   description: 차종별 매출 현황
   *                   items:
   *                     type: object
   *                     properties:
   *                       carType:
   *                         $ref: '#/components/schemas/CarTypeForDashboard'
   *                       amount:
   *                         type: number
   *                         example: 50000000
   *       401:
   *         description: 인증이 필요합니다
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "로그인이 필요합니다"
   */

  router.get('/', isAuthenticated, dashboardController.getSummary);

  return router;
};
