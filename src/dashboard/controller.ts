import { Request, Response, NextFunction } from 'express';
import DashboardService from './service';
import { SummaryResponseDto } from './dto/summary-response.dto';

class DashboardController {
  static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = (req as any).user?.companyId;

      if (!companyId) {
        res.status(400).json({ message: '회사 정보가 없습니다.' });
        return;
      }

      const summary: SummaryResponseDto = await DashboardService.getSummary(companyId);
      res.status(200).json(summary);
    } catch (error: unknown) {
      next(error);
    }
  }
}

export default DashboardController;
