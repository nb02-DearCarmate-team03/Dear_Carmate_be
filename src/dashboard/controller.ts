import { Request, Response, NextFunction } from 'express';
import DashboardService from './service';
import { SummaryResponseDto } from './dto/summary-response.dto';

class DashboardController {
  /**
   * 대시보드 요약 통계를 조회합니다.
   *
   * - 이달의 매출, 전월 대비 성장률
   * - 계약 진행 현황 (진행 중 / 완료)
   * - 차량 타입별 계약 수 및 매출액
   *
   * @route GET /dashboard/summary
   * @access Private (JWT 인증 필요)
   *
   * @param req - Express Request 객체 (JWT에서 companyId 추출됨)
   * @param res - Express Response 객체
   * @param next - Express NextFunction (에러 처리용)
   *
   * @returns 200 OK + SummaryResponseDto JSON
   *          400 Bad Request (회사 정보 누락 시)
   *          500 Internal Server Error (예외 발생 시)
   */
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
