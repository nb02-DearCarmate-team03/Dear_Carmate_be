import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { DashboardRepository } from './repository';
import { DashboardService } from './service';
import { DashboardController } from './controller';
import prisma from '../common/prisma/client';

const router = Router();

// 의존성 생성 및 주입
const dashboardRepository = new DashboardRepository(prisma);
const dashboardService = new DashboardService(dashboardRepository);
const dashboardController = new DashboardController(dashboardService);

// 라우팅
router.get('/summary', authenticateJWT, dashboardController.getSummary.bind(dashboardController));

export default router;
