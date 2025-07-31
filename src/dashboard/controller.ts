import { Request, Response, NextFunction } from 'express';
import { SummaryResponseDto } from './dto/summary-response.dto';
import { DashboardService } from './service';

export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {
    // DashboardService 의존성 주입
  }

  /**
   * 대시보드 요약 통계 조회
   */
  getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        res.status(400).json({ message: '회사 정보가 없습니다.' });
        return;
      }

      const summary: SummaryResponseDto = await this.dashboardService.getSummary(companyId);
      res.status(200).json(summary);
    } catch (error) {
      next(error);
    }
  };
}
