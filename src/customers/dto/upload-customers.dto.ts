import { IsString, IsEnum, IsEmail, IsOptional, Length, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { Gender, AgeGroup, Region } from '@prisma/client';

export class UploadCustomersDto {
  // 파일 업로드는 multer를 통해 처리되므로 DTO는 비어있습니다
}
