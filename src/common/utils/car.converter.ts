import { CarStatus, CarType } from '@prisma/client';

/**
 * CarStatus Enum을 camelCase로 변환
 */
export function carStatusToCamelCase(status: CarStatus | null): string | null {
  if (!status) return null;

  const statusMapping: Record<CarStatus, string> = {
    [CarStatus.POSSESSION]: 'possession',
    [CarStatus.CONTRACT_PROCEEDING]: 'contractProceeding',
    [CarStatus.CONTRACT_COMPLETED]: 'contractCompleted',
  };

  return statusMapping[status] || status;
}

/**
 * CarType Enum을 한글로 변환
 */
export function carTypeToKorean(type: CarType | null): string | null {
  if (!type) return null;

  const typeMapping: Record<CarType, string> = {
    [CarType.COMPACT]: '경·소형',
    [CarType.MIDSIZE]: '준중·중형',
    [CarType.FULLSIZE]: '대형',
    [CarType.SPORTS]: '스포츠카',
    [CarType.SUV]: 'SUV',
  };

  return typeMapping[type] || type;
}

/**
 * Car 엔티티의 enum 필드들을 변환
 */
export function convertCarEnums(car: { status: CarStatus | null; type: CarType | null }) {
  return {
    status: carStatusToCamelCase(car.status),
    type: carTypeToKorean(car.type),
  };
}
