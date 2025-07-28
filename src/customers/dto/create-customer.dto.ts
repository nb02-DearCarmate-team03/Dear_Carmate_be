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
