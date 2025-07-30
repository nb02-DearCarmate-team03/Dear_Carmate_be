import { IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CarTypeCountDto } from './car-type-count.dto';
import { SalesByCarTypeDto } from './sales-by-car-type.dto';

export class SummaryResponseDto {
  @IsNumber()
  monthlySales: number;

  @IsNumber()
  lastMonthSales: number;

  @IsNumber()
  growthRate: number;

  @IsNumber()
  proceedingContractsCount: number;

  @IsNumber()
  completedContractsCount: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CarTypeCountDto)
  contractsByCarType: CarTypeCountDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalesByCarTypeDto)
  salesByCarType: SalesByCarTypeDto[];
}
