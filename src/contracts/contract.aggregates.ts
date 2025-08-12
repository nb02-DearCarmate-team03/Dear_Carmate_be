import { Prisma, CarStatus, CarType, ContractStatus as PrismaContractStatus } from '@prisma/client';
import { carTypeToKorean } from '../common/utils/car.converter';

export async function refreshAggregatesAfterContractChange(
  tx: Prisma.TransactionClient,
  companyId: number,
  customerId: number | null,
  carId: number | null,
): Promise<{
  totalContractCount: number;
  revenueByCarType: Record<string, number>; // ← 한글 라벨로 키를 씁니다
  customerContractCount: number | null;
  nextCarStatus: CarStatus | null;
}> {
  // 1) 회사 전체 계약 수
  const totalContractCount = await tx.contract.count({ where: { companyId } });

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

  // ✅ 선언 누락 해결: 먼저 객체 선언
  const revenueByCarType: Record<string, number> = {};
  carTypes.forEach((type, idx) => {
    const sum = Number(aggregates[idx]?._sum.contractPrice ?? 0); // undefined 가드
    const label = carTypeToKorean(type) ?? String(type); // 한글 라벨 적용
    revenueByCarType[label] = sum;
  });

  // 3) 고객의 계약 횟수
  let customerContractCount: number | null = null;
  if (typeof customerId === 'number') {
    customerContractCount = await tx.contract.count({
      where: { companyId, customerId },
    });
  }

  // 4) 차량 상태 재계산 후 반영 (그대로 유지)
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
