import { CarType } from '../../common/enums/car-type.enum';

/**
 * Prisma groupBy 결과 원본 구조 DTO
 * - _sum.car.price 구조를 그대로 반영
 */
export class SalesByCarTypeRawDto {
  carType: CarType;
  _sum: {
    car: {
      price: number;
    };
  } | null;
}
