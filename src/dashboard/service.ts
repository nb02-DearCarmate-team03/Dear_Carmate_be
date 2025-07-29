import DashboardRepository from './repository';
import { CarType } from '../common/enums/car-type.enum';
import { SummaryResponseDto } from './dto/summary-response.dto';
import { ContractByCarTypeDto } from './dto/contract-by-car-type.dto';
import { SalesByCarTypeDto } from './dto/sales-by-car-type.dto';

/**
 * 차량 타입별 매출액 groupBy 결과 타입 (Prisma 원시 결과)
 */
type GroupedSalesByCarType = {
  carType: CarType | null;
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
      DashboardRepository.getContractsByCarType(companyId), // Record<string, number>
      DashboardRepository.getSalesByCarType(companyId), // GroupBy 결과
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
        count: totalPrice,
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

export default DashboardService;
