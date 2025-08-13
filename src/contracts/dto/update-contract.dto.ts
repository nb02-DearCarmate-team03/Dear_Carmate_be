import {
  IsOptional,
  IsEnum,
  IsInt,
  IsDateString,
  ValidateNested,
  IsArray,
  IsNumber,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ContractStatus as PrismaContractStatus } from '@prisma/client';
import { UpdateContractDocumentDto } from './update-contract-document.dto';
import { MeetingDto } from './meeting.dto';
import {
  ToIdentifier,
  ToCurrencyAmount,
  ToKoreaStandardTimeDateTime,
} from '../../common/utils/contract.converter';

function toPrismaStatus(value?: unknown): PrismaContractStatus | undefined {
  if (value == null) return undefined;
  if (Object.values(PrismaContractStatus).includes(value as PrismaContractStatus))
    return value as PrismaContractStatus;
  if (typeof value === 'string') {
    const [head = ''] = value.split('|', 1);
    const key = head
      .trim()
      .replace(/[_\-\s]/g, '')
      .toLowerCase();
    const map: Record<string, PrismaContractStatus> = {
      carinspection: PrismaContractStatus.CAR_INSPECTION,
      pricenegotiation: PrismaContractStatus.PRICE_NEGOTIATION,
      contractdraft: PrismaContractStatus.CONTRACT_DRAFT,
      contractsuccessful: PrismaContractStatus.CONTRACT_SUCCESSFUL,
      contractfailed: PrismaContractStatus.CONTRACT_FAILED,
    };
    return map[key];
  }
  return undefined;
}

export class UpdateContractDto {
  @IsOptional()
  @IsInt()
  @ToIdentifier()
  userId?: number;

  @IsOptional()
  @IsInt()
  @ToIdentifier()
  customerId?: number;

  @IsOptional()
  @IsInt()
  @ToIdentifier()
  carId?: number;

  @IsOptional()
  @Transform(({ value }) => toPrismaStatus(value))
  @IsEnum(PrismaContractStatus)
  status?: PrismaContractStatus;

  @IsOptional()
  @IsDateString()
  @ToKoreaStandardTimeDateTime()
  resolutionDate?: string;

  @IsOptional()
  @IsNumber()
  @ToCurrencyAmount()
  contractPrice?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MeetingDto)
  meetings?: MeetingDto[];

  @IsOptional()
  contractDocuments?: Array<number | { id: number }>;
}
