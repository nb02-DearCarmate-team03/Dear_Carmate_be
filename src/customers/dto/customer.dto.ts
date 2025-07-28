/* eslint-disable max-classes-per-file */
import { IsString, IsEnum, IsEmail, IsOptional, Length, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { Gender, AgeGroup, Region } from '@prisma/client';

export class CreateCustomerDto {
  @IsString()
  @Length(1, 50)
  name!: string;

  @IsOptional()
  @IsEnum(Gender)
  gender: Gender;

  @IsString()
  @Length(1, 20)
  phoneNumber!: string;

  @IsOptional()
  @IsEnum(AgeGroup)
  ageGroup?: AgeGroup;

  @IsOptional()
  @IsEnum(Region)
  region?: Region;

  @IsOptional()
  @IsEmail()
  @Length(1, 100)
  email: string;

  @IsOptional()
  @IsString()
  memo?: string;
}

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  name?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  phoneNumber?: string;

  @IsOptional()
  @IsEnum(AgeGroup)
  ageGroup?: AgeGroup;

  @IsOptional()
  @IsEnum(Region)
  region?: Region;

  @IsOptional()
  @IsEmail()
  @Length(1, 100)
  email?: string;

  @IsOptional()
  @IsString()
  memo?: string;
}

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
  pageSize?: number = 10;

  @IsOptional()
  @IsString()
  searchBy?: string;

  @IsOptional()
  @IsString()
  keyword?: string;
}

export class UploadCustomersDto {
  // 파일 업로드는 multer를 통해 처리되므로 DTO는 비어있습니다
}
