import { Router } from 'express';
import DashboardController from './controller';

const router = Router();

/**
 * @route GET /dashboard/summary
 * @desc 이 달의 매출, 계약 진행 수, 계약 성공 수 요약
 */
router.get('/summary', DashboardController.getSummary);

export default router;
