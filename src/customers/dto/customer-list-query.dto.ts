import { IsString, IsEnum, IsEmail, IsOptional, Length, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { Gender, AgeGroup, Region } from '@prisma/client';

export class CustomerListQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  pageSize?: number = 8;

  @IsOptional()
  @IsString()
  searchBy?: string;

  @IsOptional()
  @IsString()
  keyword?: string;
}
