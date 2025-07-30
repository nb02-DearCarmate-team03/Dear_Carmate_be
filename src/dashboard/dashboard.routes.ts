import { Router } from 'express';
import DashboardController from './controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

/**
 * GET /dashboard
 *
 * 대시보드 요약 통계 조회
 *
 * - 이 달의 매출
 * - 계약 진행 중인 수
 * - 계약 성공한 수
 * - 차량 타입별 계약 수 & 매출액
 *
 * @access Private (JWT 인증 필요)
 * @returns 200 OK + SummaryResponseDto JSON
 */
router.get('/', authenticateJWT, DashboardController.getSummary);

export default router;
