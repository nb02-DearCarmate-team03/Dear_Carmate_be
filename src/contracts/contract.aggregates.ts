import { Prisma, CarStatus, CarType, ContractStatus as PrismaContractStatus } from '@prisma/client';
import { carTypeToKorean } from '../common/utils/car.converter';

export async function refreshAggregatesAfterContractChange(
  tx: Prisma.TransactionClient,
  companyId: number,
  customerId: number | null,
  carId: number | null,
): Promise<{
  totalContractCount: number;
  revenueByCarType: Record<string, number>;
  customerContractCount: number | null;
  nextCarStatus: CarStatus | null;
}> {
  // 1) 회사 전체 계약 수 (필요하면 성공만 카운트로 바꿔도 됨)
  const totalContractCount = await tx.contract.count({ where: { companyId } });
  // 성공만 집계하려면 아래로 교체:
  // const totalContractCount = await tx.contract.count({
  //   where: { companyId, status: PrismaContractStatus.CONTRACT_SUCCESSFUL },
  // });

  // 2) 차량 유형별 매출 합계(성공 계약만)
  const carTypes: CarType[] = ['COMPACT', 'MIDSIZE', 'FULLSIZE', 'SPORTS', 'SUV'];
  const aggregates = await Promise.all(
    carTypes.map((type) =>
      tx.contract.aggregate({
        _sum: { contractPrice: true },
        where: {
          companyId,
          status: PrismaContractStatus.CONTRACT_SUCCESSFUL,
          car: { type },
        },
      }),
    ),
  );

  const revenueByCarType: Record<string, number> = {};
  carTypes.forEach((type, idx) => {
    const sum = Number(aggregates[idx]?._sum.contractPrice ?? 0);
    const label = carTypeToKorean(type) ?? String(type);
    revenueByCarType[label] = sum;
  });

  // 3) 고객의 '계약 완료' 횟수 계산 + 고객 레코드에 반영
  let customerContractCount: number | null = null;
  if (customerId != null) {
    customerContractCount = await tx.contract.count({
      where: {
        companyId,
        customerId,
        status: PrismaContractStatus.CONTRACT_SUCCESSFUL,
        deletedAt: null, // 소프트 삭제 제외
      },
    });

    await tx.customer.update({
      where: { id: customerId },
      data: { contractCount: customerContractCount },
    });
  }

  // 4) 차량 상태 재계산 후 반영
  let nextCarStatus: CarStatus | null = null;
  if (typeof carId === 'number') {
    const successfulCount = await tx.contract.count({
      where: { companyId, carId, status: PrismaContractStatus.CONTRACT_SUCCESSFUL },
    });

    if (successfulCount > 0) {
      nextCarStatus = CarStatus.CONTRACT_COMPLETED;
    } else {
      const proceedingCount = await tx.contract.count({
        where: {
          companyId,
          carId,
          status: {
            in: [
              PrismaContractStatus.CAR_INSPECTION,
              PrismaContractStatus.PRICE_NEGOTIATION,
              PrismaContractStatus.CONTRACT_DRAFT,
            ],
          },
        },
      });
      nextCarStatus = proceedingCount > 0 ? CarStatus.CONTRACT_PROCEEDING : CarStatus.POSSESSION;
    }

    await tx.car.update({ where: { id: carId }, data: { status: nextCarStatus } });
  }

  return { totalContractCount, revenueByCarType, customerContractCount, nextCarStatus };
}
