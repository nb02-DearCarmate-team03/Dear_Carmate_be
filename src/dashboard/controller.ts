import { Request, Response, NextFunction } from 'express';
import { SummaryResponseDto } from './dto/summary-response.dto';
import { DashboardService } from './service';

const createDashboardController = (dashboardService: DashboardService) => {
  const getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        res.status(400).json({ message: '회사 정보가 없습니다.' });
        return;
      }

      const summary: SummaryResponseDto = await dashboardService.getSummary(companyId);
      res.status(200).json(summary);
    } catch (error) {
      next(error);
    }
  };

  return {
    getSummary,
  };
};

export default createDashboardController;
