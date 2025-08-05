import { IsEnum, IsNumber, IsOptional, IsString, IsDate } from 'class-validator';
import { UploadStatus, UploadType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CsvUploadResponseDto {
  @IsNumber()
  id: number;

  @IsNumber()
  companyId: number;

  @IsNumber()
  userId: number;

  @IsString()
  fileName: string;

  @IsString()
  fileUrl: string;

  @IsEnum(UploadType)
  fileType: UploadType;

  @IsEnum(UploadStatus)
  status: UploadStatus;

  @IsNumber()
  totalRecords: number;

  @IsNumber()
  processedRecords: number;

  @IsNumber()
  successRecords: number;

  @IsNumber()
  failedRecords: number;

  @IsOptional()
  @IsString()
  errorMessage?: string;

  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @IsDate()
  @Type(() => Date)
  updatedAt: Date;
}
