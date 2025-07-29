import { PrismaClient, ContractStatus } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 해당 회사의 이달 매출을 계산합니다.
 *
 * - 기준: 이번 달 1일부터 말일까지 생성된 계약
 * - 조건: 계약 상태가 CONTRACT_SUCCESSFUL
 *
 * @param companyId - 회사 ID
 * @returns 총 매출 (number, 없으면 0)
 */
const getMonthlyRevenue = async (companyId: number): Promise<number> => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const result = await prisma.contract.aggregate({
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
};

/**
 * 해당 회사의 전월 매출을 계산합니다.
 *
 * - 기준: 전 달 1일부터 말일까지 생성된 계약
 * - 조건: 계약 상태가 CONTRACT_SUCCESSFUL
 *
 * @param companyId - 회사 ID
 * @returns 전월 총 매출 (number, 없으면 0)
 */
const getLastMonthRevenue = async (companyId: number): Promise<number> => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);

  const result = await prisma.contract.aggregate({
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
};

/**
 * 해당 회사의 진행 중인 계약 수를 계산합니다.
 *
 * - 조건: 계약 상태가 CAR_INSPECTION, PRICE_NEGOTIATION, CONTRACT_DRAFT 중 하나
 *
 * @param companyId - 회사 ID
 * @returns 진행 중인 계약 수
 */
const getOngoingContractCount = async (companyId: number): Promise<number> => {
  return prisma.contract.count({
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
};

/**
 * 해당 회사의 계약 성공 수를 계산합니다.
 *
 * - 조건: 계약 상태가 CONTRACT_SUCCESSFUL
 *
 * @param companyId - 회사 ID
 * @returns 계약 성공 수
 */
const getSuccessfulContractCount = async (companyId: number): Promise<number> => {
  return prisma.contract.count({
    where: {
      companyId,
      status: ContractStatus.CONTRACT_SUCCESSFUL,
    },
  });
};

/**
 * 해당 회사의 차량 타입별 계약 수를 집계합니다.
 *
 * - 기준: 회사 소속 차량별 연결된 계약 수
 *
 * @param companyId - 회사 ID
 * @returns 차량 타입별 계약 수 객체 (Record<string, number>)
 */
const getContractsByCarType = async (companyId: number) => {
  const cars = await prisma.car.findMany({
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

  const grouped = cars.reduce(
    (acc, car) => {
      const typeKey = car.type ?? 'UNKNOWN';
      if (!acc[typeKey]) {
        acc[typeKey] = 0;
      }
      acc[typeKey] += car.contracts.length;
      return acc;
    },
    {} as Record<string, number>,
  );

  return grouped;
};

/**
 * 해당 회사의 차량 타입별 매출 총합을 계산합니다.
 *
 * - 조건: 계약 상태가 CONTRACT_SUCCESSFUL인 계약만 집계
 * - 기준: 차량별 계약 금액의 총합
 *
 * @param companyId - 회사 ID
 * @returns 차량 타입별 매출액 (Record<string, number>)
 */
const getSalesByCarType = async (companyId: number) => {
  const cars = await prisma.car.findMany({
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

  const grouped = cars.reduce(
    (acc, car) => {
      const typeKey = car.type ?? 'UNKNOWN';
      if (!acc[typeKey]) {
        acc[typeKey] = 0;
      }
      const total = car.contracts.reduce(
        (sum, contract) => sum + (contract.contractPrice?.toNumber() ?? 0),
        0,
      );
      acc[typeKey] += total;
      return acc;
    },
    {} as Record<string, number>,
  );

  return grouped;
};

export default {
  getMonthlyRevenue,
  getLastMonthRevenue,
  getOngoingContractCount,
  getSuccessfulContractCount,
  getContractsByCarType,
  getSalesByCarType,
};
