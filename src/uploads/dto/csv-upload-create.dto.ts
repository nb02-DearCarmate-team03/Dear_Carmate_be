import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { UploadStatus, UploadType } from '@prisma/client';

export class CsvUploadCreateDto {
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
}
