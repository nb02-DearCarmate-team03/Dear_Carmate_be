import { IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ContractByCarTypeDto } from './contract-by-car-type.dto';
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
  @Type(() => ContractByCarTypeDto)
  contractsByCarType: ContractByCarTypeDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalesByCarTypeDto)
  salesByCarType: SalesByCarTypeDto[];
}
