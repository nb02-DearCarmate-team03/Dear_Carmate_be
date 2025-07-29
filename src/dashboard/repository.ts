import prisma from '../common/prisma/client';
import ContractStatus from '../common/enums/contract-status.enum';

const getMonthlyRevenue = async (companyId: number): Promise<number> => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const result = await prisma.contract.aggregate({
    _sum: {
      car: {
        select: { price: true },
      },
    },
    where: {
      companyId,
      status: ContractStatus.SUCCESS,
      meetingDate: {
        gte: firstDay,
        lte: lastDay,
      },
    },
  });

  return result._sum?.car?.price ?? 0;
};

const getLastMonthRevenue = async (companyId: number): Promise<number> => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);

  const result = await prisma.contract.aggregate({
    _sum: {
      car: {
        select: { price: true },
      },
    },
    where: {
      companyId,
      status: ContractStatus.SUCCESS,
      meetingDate: {
        gte: firstDay,
        lte: lastDay,
      },
    },
  });

  return result._sum?.car?.price ?? 0;
};

const getOngoingContractCount = async (companyId: number): Promise<number> => {
  return prisma.contract.count({
    where: {
      companyId,
      status: {
        in: [ContractStatus.CHECKING, ContractStatus.NEGOTIATING],
      },
    },
  });
};

const getSuccessfulContractCount = async (companyId: number): Promise<number> => {
  return prisma.contract.count({
    where: {
      companyId,
      status: ContractStatus.SUCCESS,
    },
  });
};

const getContractsByCarType = async (companyId: number) => {
  return prisma.contract.groupBy({
    by: ['carType'],
    where: {
      companyId,
    },
    _count: {
      _all: true,
    },
  });
};

const getSalesByCarType = async (companyId: number) => {
  return prisma.contract.groupBy({
    by: ['carType'],
    where: {
      companyId,
      status: ContractStatus.SUCCESS,
    },
    _sum: {
      car: {
        select: {
          price: true,
        },
      },
    },
  });
};

export default {
  getMonthlyRevenue,
  getLastMonthRevenue,
  getOngoingContractCount,
  getSuccessfulContractCount,
  getContractsByCarType,
  getSalesByCarType,
};
