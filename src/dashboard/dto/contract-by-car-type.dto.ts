import { CarType } from '../../common/enums/car-type.enum';

/**
 * 차량 타입별 계약 수 응답 DTO
 * - Prisma groupBy(_count) 결과를 매핑한 구조
 */
export class ContractByCarTypeDto {
  carType: CarType;
  count: number;
}
