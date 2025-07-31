import { PrismaClient, ContractStatus } from '@prisma/client';
import { CarType } from 'src/common/enums/car-type.enum';

export class DashboardRepository {
  constructor(private readonly prisma: PrismaClient) {
    // constructor는 PrismaClient 의존성 주입 용도로 사용됩니다.
  }

  /**
   * 이달의 총 매출 계산
   */
  async getMonthlyRevenue(companyId: number): Promise<number> {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const result = await this.prisma.contract.aggregate({
      _sum: {
        contractPrice: true,
      },
      where: {
        companyId,
        status: ContractStatus.CONTRACT_SUCCESSFUL,
        createdAt: {
          gte: firstDay,
          lte: lastDay,
        },
      },
    });

    return result._sum.contractPrice?.toNumber() ?? 0;
  }

  /**
   * 전월 총 매출 계산
   */
  async getLastMonthRevenue(companyId: number): Promise<number> {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);

    const result = await this.prisma.contract.aggregate({
      _sum: {
        contractPrice: true,
      },
      where: {
        companyId,
        status: ContractStatus.CONTRACT_SUCCESSFUL,
        createdAt: {
          gte: firstDay,
          lte: lastDay,
        },
      },
    });

    return result._sum.contractPrice?.toNumber() ?? 0;
  }

  /**
   * 진행 중인 계약 수
   */
  async getOngoingContractCount(companyId: number): Promise<number> {
    return this.prisma.contract.count({
      where: {
        companyId,
        status: {
          in: [
            ContractStatus.CAR_INSPECTION,
            ContractStatus.PRICE_NEGOTIATION,
            ContractStatus.CONTRACT_DRAFT,
          ],
        },
      },
    });
  }

  /**
   * 계약 성공 수
   */
  async getSuccessfulContractCount(companyId: number): Promise<number> {
    return this.prisma.contract.count({
      where: {
        companyId,
        status: ContractStatus.CONTRACT_SUCCESSFUL,
      },
    });
  }

  /**
   * 차량 타입별 계약 수
   */
  async getContractsByCarType(companyId: number): Promise<Record<string, number>> {
    const cars = await this.prisma.car.findMany({
      where: {
        companyId,
      },
      select: {
        type: true,
        contracts: {
          select: {
            id: true,
          },
        },
      },
    });

    return cars.reduce(
      (acc, car) => {
        const typeKey = car.type ?? 'UNKNOWN';
        acc[typeKey] = (acc[typeKey] || 0) + car.contracts.length;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  /**
   * 차량 타입별 매출액 합산
   */
  async getSalesByCarType(companyId: number): Promise<Record<string, number>> {
    const cars = await this.prisma.car.findMany({
      where: {
        companyId,
      },
      select: {
        type: true,
        contracts: {
          where: {
            status: ContractStatus.CONTRACT_SUCCESSFUL,
          },
          select: {
            contractPrice: true,
          },
        },
      },
    });

    return cars.reduce(
      (acc, car) => {
        const typeKey = car.type as CarType;
        const total = car.contracts.reduce(
          (sum, contract) => sum + (contract.contractPrice?.toNumber() ?? 0),
          0,
        );
        acc[typeKey] = (acc[typeKey] || 0) + total;
        return acc;
      },
      {} as Record<CarType, number>,
    );
  }
}
