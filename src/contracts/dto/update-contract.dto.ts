import { IsOptional, IsEnum, IsInt, IsDateString, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ContractStatus as PrismaContractStatus } from '@prisma/client';
import { UpdateContractDocumentDto } from './update-contract-document.dto';
import { UpdateMeetingDto } from './update-meeting.dto';

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
  @Transform(({ value }) => toPrismaStatus(value))
  @IsEnum(PrismaContractStatus)
  status?: PrismaContractStatus;

  @IsOptional()
  @IsDateString()
  resolutionDate?: string;

  @IsOptional()
  @IsInt()
  contractPrice?: number;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateMeetingDto)
  meetings?: UpdateMeetingDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateContractDocumentDto)
  contractDocuments?: UpdateContractDocumentDto[];

  @IsOptional() @IsInt() userId?: number;
  @IsOptional() @IsInt() customerId?: number;
  @IsOptional() @IsInt() carId?: number;
}
