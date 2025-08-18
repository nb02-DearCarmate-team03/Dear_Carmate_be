import { IsString, IsEnum, IsEmail, IsOptional, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { Gender, AgeGroup, Region } from '@prisma/client';

export class CreateCustomerDto {
  @IsString()
  @Length(1, 50)
  name!: string;

  @IsEnum(Gender)
  @Transform(({ value }) => {
    // 한글 및 영문 입력을 Prisma Enum으로 변환
    if (typeof value === 'string') {
      const upperValue = value.toUpperCase();
      switch (upperValue) {
        case 'MALE':
        case 'M':
        case '남성':
          return Gender.MALE;
        case 'FEMALE':
        case 'F':
        case '여성':
          return Gender.FEMALE;
        default:
          return value;
      }
    }
    return value;
  })
  gender: Gender;

  @IsString()
  @Length(1, 20)
  phoneNumber!: string;

  @IsOptional()
  @IsEnum(AgeGroup)
  @Transform(({ value }) => {
    // 한글 및 영문 입력을 Prisma Enum으로 변환
    if (typeof value === 'string') {
      const upperValue = value.toUpperCase();
      switch (upperValue) {
        case 'TEENAGER':
        case '10대':
          return AgeGroup.TEENAGER;
        case 'TWENTIES':
        case '20대':
          return AgeGroup.TWENTIES;
        case 'THIRTIES':
        case '30대':
          return AgeGroup.THIRTIES;
        case 'FORTIES':
        case '40대':
          return AgeGroup.FORTIES;
        case 'FIFTIES':
        case '50대':
          return AgeGroup.FIFTIES;
        case 'SIXTIES':
        case '60대':
          return AgeGroup.SIXTIES;
        case 'SEVENTIES':
        case '70대':
          return AgeGroup.SEVENTIES;
        case 'EIGHTIES':
        case '80대':
          return AgeGroup.EIGHTIES;
        default:
          return value;
      }
    }
    return value;
  })
  ageGroup?: AgeGroup;

  @IsOptional()
  @IsEnum(Region)
  @Transform(({ value }) => {
    // 한글 및 영문 입력을 Prisma Enum으로 변환
    if (typeof value === 'string') {
      const upperValue = value.toUpperCase();
      switch (upperValue) {
        case 'SEOUL':
        case '서울':
          return Region.SEOUL;
        case 'GYEONGGI':
        case '경기':
          return Region.GYEONGGI;
        case 'INCHEON':
        case '인천':
          return Region.INCHEON;
        case 'GANGWON':
        case '강원':
          return Region.GANGWON;
        case 'CHUNGBUK':
        case '충북':
          return Region.CHUNGBUK;
        case 'CHUNGNAM':
        case '충남':
          return Region.CHUNGNAM;
        case 'SEJONG':
        case '세종':
          return Region.SEJONG;
        case 'DAEJEON':
        case '대전':
          return Region.DAEJEON;
        case 'JEONBUK':
        case '전북':
          return Region.JEONBUK;
        case 'JEONNAM':
        case '전남':
          return Region.JEONNAM;
        case 'GWANGJU':
        case '광주':
          return Region.GWANGJU;
        case 'GYEONGBUK':
        case '경북':
          return Region.GYEONGBUK;
        case 'GYEONGNAM':
        case '경남':
          return Region.GYEONGNAM;
        case 'DAEGU':
        case '대구':
          return Region.DAEGU;
        case 'ULSAN':
        case '울산':
          return Region.ULSAN;
        case 'BUSAN':
        case '부산':
          return Region.BUSAN;
        case 'JEJU':
        case '제주':
          return Region.JEJU;
        default:
          return value;
      }
    }
    return value;
  })
  region?: Region;

  @IsEmail()
  @Length(1, 100)
  email: string;

  @IsOptional()
  @IsString()
  memo?: string;
}
