// 차량 타입별 매출 통계를 위한 API 응답용 DTO
import { CarType } from '../../common/enums/car-type.enum';

/**
 * 차량 타입별 매출 정보
 *
 * - carType: 차량 분류 (SUV, SEDAN 등)
 * - count: 해당 타입 차량들의 총 매출액
 */
export class SalesByCarTypeDto {
  carType: CarType;
  count: number;
}
