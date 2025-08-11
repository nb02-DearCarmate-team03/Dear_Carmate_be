import { IsString, IsEnum, IsEmail, IsOptional, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { Gender, AgeGroup, Region } from '@prisma/client';

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  name?: string;

  @IsOptional()
  @IsEnum(Gender)
  @Transform(({ value }) => {
    // 한글 입력을 Prisma Enum으로 변환
    const genderMap: Record<string, Gender> = {
      남성: 'MALE' as Gender,
      여성: 'FEMALE' as Gender,
      male: 'MALE' as Gender,
      female: 'FEMALE' as Gender,
      MALE: 'MALE' as Gender,
      FEMALE: 'FEMALE' as Gender,
    };

    if (typeof value === 'string') {
      const mapped =
        genderMap[value] || genderMap[value.toLowerCase()] || genderMap[value.toUpperCase()];
      if (mapped) return mapped;
    }
    return value;
  })
  gender?: Gender;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  phoneNumber?: string;

  @IsOptional()
  @IsEnum(AgeGroup)
  @Transform(({ value }) => {
    // 한글 입력을 Prisma Enum으로 변환
    const ageGroupMap: Record<string, AgeGroup> = {
      '10대': 'TEENAGER' as AgeGroup,
      '20대': 'TWENTIES' as AgeGroup,
      '30대': 'THIRTIES' as AgeGroup,
      '40대': 'FORTIES' as AgeGroup,
      '50대': 'FIFTIES' as AgeGroup,
      '60대': 'SIXTIES' as AgeGroup,
      '70대': 'SEVENTIES' as AgeGroup,
      '80대': 'EIGHTIES' as AgeGroup,
      TEENAGER: 'TEENAGER' as AgeGroup,
      TWENTIES: 'TWENTIES' as AgeGroup,
      THIRTIES: 'THIRTIES' as AgeGroup,
      FORTIES: 'FORTIES' as AgeGroup,
      FIFTIES: 'FIFTIES' as AgeGroup,
      SIXTIES: 'SIXTIES' as AgeGroup,
      SEVENTIES: 'SEVENTIES' as AgeGroup,
      EIGHTIES: 'EIGHTIES' as AgeGroup,
    };

    if (typeof value === 'string') {
      return ageGroupMap[value] || value;
    }
    return value;
  })
  ageGroup?: AgeGroup;

  @IsOptional()
  @IsEnum(Region)
  @Transform(({ value }) => {
    // 한글 입력을 Prisma Enum으로 변환
    const regionMap: Record<string, Region> = {
      서울: 'SEOUL' as Region,
      경기: 'GYEONGGI' as Region,
      인천: 'INCHEON' as Region,
      강원: 'GANGWON' as Region,
      충북: 'CHUNGBUK' as Region,
      충남: 'CHUNGNAM' as Region,
      세종: 'SEJONG' as Region,
      대전: 'DAEJEON' as Region,
      전북: 'JEONBUK' as Region,
      전남: 'JEONNAM' as Region,
      광주: 'GWANGJU' as Region,
      경북: 'GYEONGBUK' as Region,
      경남: 'GYEONGNAM' as Region,
      대구: 'DAEGU' as Region,
      울산: 'ULSAN' as Region,
      부산: 'BUSAN' as Region,
      제주: 'JEJU' as Region,
      SEOUL: 'SEOUL' as Region,
      GYEONGGI: 'GYEONGGI' as Region,
      INCHEON: 'INCHEON' as Region,
      GANGWON: 'GANGWON' as Region,
      CHUNGBUK: 'CHUNGBUK' as Region,
      CHUNGNAM: 'CHUNGNAM' as Region,
      SEJONG: 'SEJONG' as Region,
      DAEJEON: 'DAEJEON' as Region,
      JEONBUK: 'JEONBUK' as Region,
      JEONNAM: 'JEONNAM' as Region,
      GWANGJU: 'GWANGJU' as Region,
      GYEONGBUK: 'GYEONGBUK' as Region,
      GYEONGNAM: 'GYEONGNAM' as Region,
      DAEGU: 'DAEGU' as Region,
      ULSAN: 'ULSAN' as Region,
      BUSAN: 'BUSAN' as Region,
      JEJU: 'JEJU' as Region,
    };

    if (typeof value === 'string') {
      return regionMap[value] || value;
    }
    return value;
  })
  region?: Region;

  @IsOptional()
  @IsEmail()
  @Length(1, 100)
  email?: string;

  @IsOptional()
  @IsString()
  memo?: string;
}
