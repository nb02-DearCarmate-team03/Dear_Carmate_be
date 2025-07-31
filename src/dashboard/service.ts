// export default DashboardService;
import { CarType } from '../common/enums/car-type.enum';
import { SummaryResponseDto } from './dto/summary-response.dto';
import { ContractByCarTypeDto } from './dto/contract-by-car-type.dto';
import { SalesByCarTypeDto } from './dto/sales-by-car-type.dto';
import { DashboardRepository } from './repository';

/**
 * Prisma groupBy 결과 내부에서 사용하는 타입
 * - 차량 타입별 매출 집계 (_sum.car.price 형태)
 */
type GroupedSalesByCarType = {
  carType: CarType | null;
  _sum: {
    car: {
      price: number;
    };
  } | null;
};

export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {
    // constructor는 PrismaClient 의존성 주입 용도로 사용됩니다.
  }

  /**
   * 대시보드 요약 정보를 반환합니다.
   *
   * - 이달의 매출 및 전월 매출 비교 (성장률 포함)
   * - 계약 진행/완료 건수
   * - 차량 타입별 계약 수 & 매출액
   *
   * @param companyId - 조회할 회사 ID
   * @returns SummaryResponseDto 형식의 통계 정보
   */
  async getSummary(companyId: number): Promise<SummaryResponseDto> {
    const [
      monthlySales,
      lastMonthSales,
      proceedingContractsCount,
      completedContractsCount,
      contractsByCarTypeRaw,
      salesByCarTypeRaw,
    ] = await Promise.all([
      this.dashboardRepository.getMonthlyRevenue(companyId),
      this.dashboardRepository.getLastMonthRevenue(companyId),
      this.dashboardRepository.getOngoingContractCount(companyId),
      this.dashboardRepository.getSuccessfulContractCount(companyId),
      this.dashboardRepository.getContractsByCarType(companyId),
      this.dashboardRepository.getSalesByCarType(companyId),
    ]);

    const growthRate =
      lastMonthSales === 0
        ? 100
        : Number((((monthlySales - lastMonthSales) / lastMonthSales) * 100).toFixed(2));

    const contractsByCarType: ContractByCarTypeDto[] = Object.entries(contractsByCarTypeRaw).map(
      ([carType, count]) => ({
        carType: carType as CarType,
        count,
      }),
    );

    const salesByCarType: SalesByCarTypeDto[] = Object.entries(salesByCarTypeRaw).map(
      ([carType, totalPrice]) => ({
        carType: carType as CarType,
        amount: totalPrice,
      }),
    );

    return {
      monthlySales,
      lastMonthSales,
      growthRate,
      proceedingContractsCount,
      completedContractsCount,
      contractsByCarType,
      salesByCarType,
    };
  }
}
