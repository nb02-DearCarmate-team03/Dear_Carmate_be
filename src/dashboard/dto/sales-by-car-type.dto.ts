// API 응답용 DTO
import { CarType } from '../../common/enums/car-type.enum';

export class SalesByCarTypeDto {
  carType: CarType;
  count: number;
}
