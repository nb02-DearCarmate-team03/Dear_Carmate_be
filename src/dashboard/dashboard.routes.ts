import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { DashboardRepository } from './repository';
import { DashboardService } from './service';
import { DashboardController } from './controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

export const dashboardRouter = (prisma: PrismaClient): Router => {
  const router = Router();

  const dashboardRepository = new DashboardRepository(prisma);
  const dashboardService = new DashboardService(dashboardRepository);
  const dashboardController = new DashboardController(dashboardService);

  router.get('/summary', authenticateJWT, dashboardController.getSummary);

  return router;
};
