import { PrismaClient, ContractStatus } from '@prisma/client';

const prisma = new PrismaClient();

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

const getSuccessfulContractCount = async (companyId: number): Promise<number> => {
  return prisma.contract.count({
    where: {
      companyId,
      status: ContractStatus.CONTRACT_SUCCESSFUL,
    },
  });
};

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
