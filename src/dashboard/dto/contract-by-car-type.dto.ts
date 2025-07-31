import { IsEnum, IsNumber } from 'class-validator';
import { CarType } from '../../common/enums/car-type.enum';

export class ContractByCarTypeDto {
  @IsEnum(CarType)
  carType: CarType;

  @IsNumber()
  count: number;
}
