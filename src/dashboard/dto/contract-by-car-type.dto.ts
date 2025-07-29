import { CarType } from '../../common/enums/car-type.enum';

/**
 * 차량 타입별 매출 통계 DTO
 */

export class SalesByCarTypeDto {
  carType: CarType;
  count: number; // 매출 총합 (금액)
}

export type ContractByCarType = {
  carType: CarType;
  _count: { _all: number };
};
