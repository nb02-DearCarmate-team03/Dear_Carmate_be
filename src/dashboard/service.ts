/* eslint-disable no-useless-constructor */
import { CarType } from '../common/enums/car-type.enum';
import { DashboardRepository } from './repository';
import { SummaryResponseDto } from './dto/summary-response.dto';
import { ContractByCarTypeDto } from './dto/contract-by-car-type.dto';
import { SalesByCarTypeDto } from './dto/sales-by-car-type.dto';

const carTypeValues: CarType[] = Object.values(CarType).filter(
  (v) => typeof v === 'string',
) as CarType[];

export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {
    //   생성자에서 DashboardRepository를 주입받음
  }

  async getSummary(companyId: number): Promise<SummaryResponseDto> {
    const [
      monthlySales,
      lastMonthSales,
      proceedingContractsCount,
      completedContractsCount,
      contractsByCarTypeMap,
      salesByCarTypeMap,
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

    const contractsByCarType: ContractByCarTypeDto[] = carTypeValues.map((t) => ({
      carType: t,
      carTypeLabel: t,
      count: contractsByCarTypeMap[t] ?? 0,
    }));

    const salesByCarType: SalesByCarTypeDto[] = carTypeValues.map((t) => {
      const value = salesByCarTypeMap[t] ?? 0; // 원(₩) 단위 합계
      return {
        carType: t,
        carTypeLabel: t,
        amount: value,
        revenue: value, // 프런트가 revenue를 참조해도 동작
        count: value, // 프런트 차트가 sales에서도 count를 읽는 현 구현과 호환
      };
    });

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
