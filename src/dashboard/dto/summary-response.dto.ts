import { CarType } from '../../common/enums/car-type.enum';

/**
 * 대시보드 전체 요약 통계 응답 DTO
 */
export class SummaryResponseDto {
  monthlySales: number;
  lastMonthSales: number;
  growthRate: number;
  proceedingContractsCount: number;
  completedContractsCount: number;

  contractsByCarType: {
    carType: CarType;
    count: number;
  }[];

  salesByCarType: {
    carType: CarType;
    count: number;
  }[];
}
