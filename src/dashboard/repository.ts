/* eslint-disable no-useless-constructor */
import {
  PrismaClient,
  Prisma,
  ContractStatus as PrismaContractStatus,
  CarType as PrismaCarType,
} from '@prisma/client';
import { CarType } from '../common/enums/car-type.enum';
import { carTypeToKorean } from '../common/utils/car.converter';

// ---- 유틸 (this/루프 미사용) ----

const carTypeValues: CarType[] = Object.values(CarType).filter(
  (v) => typeof v === 'string',
) as CarType[];

const makeZeroBaseByCarType = (): Record<CarType, number> =>
  carTypeValues.reduce<Record<CarType, number>>(
    (acc, t) => {
      acc[t] = 0;
      return acc;
    },
    {} as Record<CarType, number>,
  );

const getThisMonthRange = (): { firstDay: Date; lastDay: Date } => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { firstDay, lastDay };
};

const getLastMonthRange = (): { firstDay: Date; lastDay: Date } => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  return { firstDay, lastDay };
};

// ---- Repository ----

export class DashboardRepository {
  constructor(private readonly prisma: PrismaClient | Prisma.TransactionClient) {
    // 생성자에서 PrismaClient 또는 TransactionClient를 주입받음
  }

  /** 이번 달 총 매출 (성공 계약만) */
  async getMonthlyRevenue(companyId: number): Promise<number> {
    const { firstDay, lastDay } = getThisMonthRange();
    const rows = await this.prisma.contract.findMany({
      where: {
        companyId,
        status: PrismaContractStatus.CONTRACT_SUCCESSFUL,
        createdAt: { gte: firstDay, lte: lastDay }, // 필요 시 contractDate로 교체
      },
      select: { contractPrice: true },
    });

    return rows.reduce<number>((sum, r) => {
      const val = r.contractPrice?.toString?.();
      return sum + Number(val ?? 0);
    }, 0);
  }

  /** 지난 달 총 매출 (성공 계약만) */
  async getLastMonthRevenue(companyId: number): Promise<number> {
    const { firstDay, lastDay } = getLastMonthRange();
    const rows = await this.prisma.contract.findMany({
      where: {
        companyId,
        status: PrismaContractStatus.CONTRACT_SUCCESSFUL,
        createdAt: { gte: firstDay, lte: lastDay },
      },
      select: { contractPrice: true },
    });

    return rows.reduce<number>((sum, r) => {
      const val = r.contractPrice?.toString?.();
      return sum + Number(val ?? 0);
    }, 0);
  }

  /** 진행 중 계약 수 (정의에 맞게 조정 가능) */
  async getOngoingContractCount(companyId: number): Promise<number> {
    return this.prisma.contract.count({
      where: {
        companyId,
        NOT: { status: PrismaContractStatus.CONTRACT_SUCCESSFUL },
      },
    });
  }

  /** 성사된 계약 수 */
  async getSuccessfulContractCount(companyId: number): Promise<number> {
    return this.prisma.contract.count({
      where: { companyId, status: PrismaContractStatus.CONTRACT_SUCCESSFUL },
    });
  }

  /** 이번 달 차량타입별 계약 수 (성공 계약만) */
  async getContractsByCarType(companyId: number): Promise<Record<CarType, number>> {
    const { firstDay, lastDay } = getThisMonthRange();

    const rows = await this.prisma.contract.findMany({
      where: {
        companyId,
        status: PrismaContractStatus.CONTRACT_SUCCESSFUL,
        createdAt: { gte: firstDay, lte: lastDay },
      },
      select: { car: { select: { type: true } } },
    });

    const base = makeZeroBaseByCarType();

    rows.forEach((row) => {
      const tPrisma = row.car?.type as PrismaCarType | undefined; // COMPACT, MIDSIZE, ...
      const label = tPrisma ? (carTypeToKorean(tPrisma) as CarType) : undefined; // → '경·소형' 등
      if (label && label in base) base[label] += 1;
    });

    return base;
  }

  /** 이번 달 차량타입별 매출 합계 (성공 계약만) */
  async getSalesByCarType(companyId: number): Promise<Record<CarType, number>> {
    const { firstDay, lastDay } = getThisMonthRange();

    const rows = await this.prisma.contract.findMany({
      where: {
        companyId,
        status: PrismaContractStatus.CONTRACT_SUCCESSFUL,
        createdAt: { gte: firstDay, lte: lastDay },
      },
      select: {
        contractPrice: true,
        car: { select: { type: true } },
      },
    });

    const base = makeZeroBaseByCarType();

    rows.forEach((row) => {
      const tPrisma = row.car?.type as PrismaCarType | undefined;
      const label = tPrisma ? (carTypeToKorean(tPrisma) as CarType) : undefined;
      const price = Number(row.contractPrice?.toString?.() ?? 0);
      if (label && label in base) base[label] += price;
    });

    return base;
  }
}
