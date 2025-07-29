import DashboardRepository from './repository';
import { CarType } from '../common/enums/car-type.enum';
import { SummaryResponseDto } from './dto/summary-response.dto';
import { SalesByCarTypeDto } from './dto/sales-by-car-type.dto';

/**
 * 차량 타입별 계약 수 groupBy 결과 타입 (carType은 optional)
 */
type GroupedContractByCarType = {
  carType?: CarType;
  _count: {
    _all: number;
  };
};

/**
 * 차량 타입별 매출액 groupBy 결과 타입 (carType은 optional)
 */
type GroupedSalesByCarType = {
  carType?: CarType;
  _sum: {
    car: {
      price: number;
    };
  } | null;
};

class DashboardService {
  static async getSummary(companyId: number): Promise<SummaryResponseDto> {
    const [
      monthlySales,
      lastMonthSales,
      proceedingContractsCount,
      completedContractsCount,
      contractsByCarTypeRaw,
      salesByCarTypeRaw,
    ] = await Promise.all([
      DashboardRepository.getMonthlyRevenue(companyId),
      DashboardRepository.getLastMonthRevenue(companyId),
      DashboardRepository.getOngoingContractCount(companyId),
      DashboardRepository.getSuccessfulContractCount(companyId),
      DashboardRepository.getContractsByCarType(companyId),
      DashboardRepository.getSalesByCarType(companyId),
    ]);

    const growthRate =
      lastMonthSales === 0
        ? 100
        : Number((((monthlySales - lastMonthSales) / lastMonthSales) * 100).toFixed(2));

    const contractsByCarType = (contractsByCarTypeRaw as GroupedContractByCarType[]).map(
      (item) => ({
        carType: item.carType ?? '알수없음', // 또는 as CarType
        count: item._count._all,
      }),
    );

    const salesByCarType = (salesByCarTypeRaw as GroupedSalesByCarType[]).map((item) => ({
      carType: item.carType ?? '알수없음',
      count: item._sum?.car?.price ?? 0,
    }));

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

export default DashboardService;
