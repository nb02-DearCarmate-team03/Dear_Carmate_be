import { CarType } from '../../common/enums/car-type.enum';

/**
 * 차량 타입별 매출 (Prisma groupBy 결과용 내부 DTO)
 *
 * - Prisma에서 groupBy를 사용할 때 반환되는 원본 형태를 반영한 구조입니다.
 * - 실제 API 응답에서는 사용되지 않고, Service 레이어에서 SalesByCarTypeDto로 변환됩니다.
 *
 */
export class SalesByCarTypeRawDto {
  carType: CarType;
  _sum: {
    car: {
      price: number;
    };
  } | null;
}
