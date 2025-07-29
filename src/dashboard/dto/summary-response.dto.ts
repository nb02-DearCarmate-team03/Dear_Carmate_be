import { CarType } from '../../common/enums/car-type.enum';

/**
 * 차량 타입별 매출 통계 DTO
 */

export type SalesByCarType = {
  carType: CarType;
  _sum: { car: { price: number } } | null;
};

export type SummaryResponseDto = {
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
};
