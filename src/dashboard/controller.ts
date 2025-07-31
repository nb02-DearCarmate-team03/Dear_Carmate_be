import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './service';
import { DashboardRepository } from './repository';
import { SummaryResponseDto } from './dto/summary-response.dto';
import prisma from '../common/prisma/client'; // PrismaClient 인스턴스

class DashboardController {
  /**
   * 대시보드 요약 통계를 조회합니다.
   *
   * @route GET /dashboard/summary
   * @access Private (JWT 인증 필요)
   */
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;

      if (!companyId) {
        res.status(400).json({ message: '회사 정보가 없습니다.' });
        return;
      }

      const repository = new DashboardRepository(prisma);
      const dashboardService = new DashboardService(repository);

      const summary: SummaryResponseDto = await dashboardService.getSummary(companyId);
      res.status(200).json(summary);
    } catch (error: unknown) {
      next(error);
    }
  }
}

export default DashboardController;
