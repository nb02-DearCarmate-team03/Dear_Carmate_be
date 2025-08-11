import {
  IsInt,
  IsOptional,
  IsNumber,
  IsDateString,
  IsEnum,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContractStatus, Possession } from '@prisma/client';
import { MeetingDto } from './meeting.dto';

export class CreateContractDto {
  @IsInt()
  carId: number;

  @IsInt()
  customerId: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  contractPrice?: number;

  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;

  @IsOptional()
  @IsDateString()
  contractDate?: string;

  @IsOptional()
  @IsEnum(Possession)
  possession?: Possession;

  @IsOptional()
  @IsBoolean()
  contractCompleted?: boolean;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MeetingDto)
  meetings?: MeetingDto[];
}
