import { IsOptional, IsInt, IsNumber, IsEnum, IsBoolean, IsDateString } from 'class-validator';
import { ContractStatus, Possession } from '@prisma/client';

export class UpdateContractDto {
  @IsOptional()
  @IsInt()
  carId?: number;

  @IsOptional()
  @IsInt()
  customerId?: number;

  @IsOptional()
  @IsInt()
  userId?: number;

  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;

  @IsOptional()
  @IsDateString()
  contractDate?: string;

  @IsOptional()
  @IsNumber()
  contractPrice?: number;

  @IsOptional()
  @IsDateString()
  resolutionDate?: string;

  @IsOptional()
  @IsEnum(Possession)
  possession?: Possession;

  @IsOptional()
  @IsBoolean()
  contractCompleted?: boolean;
}
