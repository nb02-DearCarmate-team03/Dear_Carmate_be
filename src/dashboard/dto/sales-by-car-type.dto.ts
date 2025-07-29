import { CarType } from '../../common/enums/car-type.enum';

/**
 * 차량 타입별 매출 합계 DTO
 */
export class SalesByCarTypeDto {
  carType: CarType;
  count: number;
}
