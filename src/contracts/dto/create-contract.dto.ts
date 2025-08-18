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
import { ToIdentifier, ToCurrencyAmount } from '../../common/utils/contract.converter';
import { MeetingDto } from './meeting.dto';

export class CreateContractDto {
  @IsOptional()
  @IsInt()
  @ToIdentifier()
  userId?: number;

  @IsInt()
  @ToIdentifier()
  carId: number;

  @IsInt()
  @ToIdentifier()
  customerId: number;

  @IsOptional()
  @IsNumber()
  @ToCurrencyAmount()
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
