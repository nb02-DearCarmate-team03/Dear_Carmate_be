// src/utils/customer.converter.ts
import { Gender, AgeGroup, Region } from '@prisma/client';

/**
 * Gender enum을 한글로 변환
 */
export function genderToKorean(gender: Gender | null): string | null {
  if (!gender) return null;

  // Prisma에서 실제로 반환하는 값은 @map으로 정의된 "male", "female"입니다
  const genderMap: Record<string, string> = {
    male: 'male',
    female: 'female',
    MALE: 'male', // 혹시 모를 대문자 케이스도 처리
    FEMALE: 'female',
  };

  return genderMap[gender as string] || gender;
}

/**
 * AgeGroup enum을 한글로 변환
 */
export function ageGroupToKorean(ageGroup: AgeGroup | null): string | null {
  if (!ageGroup) return null;

  const ageGroupMap: Record<AgeGroup, string> = {
    [AgeGroup.TEENAGER]: '10대',
    [AgeGroup.TWENTIES]: '20대',
    [AgeGroup.THIRTIES]: '30대',
    [AgeGroup.FORTIES]: '40대',
    [AgeGroup.FIFTIES]: '50대',
    [AgeGroup.SIXTIES]: '60대',
    [AgeGroup.SEVENTIES]: '70대',
    [AgeGroup.EIGHTIES]: '80대',
  };

  return ageGroupMap[ageGroup] || ageGroup;
}

/**
 * Region enum을 한글로 변환
 */
export function regionToKorean(region: Region | null): string | null {
  if (!region) return null;

  const regionMap: Record<Region, string> = {
    [Region.SEOUL]: '서울',
    [Region.GYEONGGI]: '경기',
    [Region.INCHEON]: '인천',
    [Region.GANGWON]: '강원',
    [Region.CHUNGBUK]: '충북',
    [Region.CHUNGNAM]: '충남',
    [Region.SEJONG]: '세종',
    [Region.DAEJEON]: '대전',
    [Region.JEONBUK]: '전북',
    [Region.JEONNAM]: '전남',
    [Region.GWANGJU]: '광주',
    [Region.GYEONGBUK]: '경북',
    [Region.GYEONGNAM]: '경남',
    [Region.DAEGU]: '대구',
    [Region.ULSAN]: '울산',
    [Region.BUSAN]: '부산',
    [Region.JEJU]: '제주',
  };

  return regionMap[region] || region;
}

/**
 * Customer 엔티티의 enum 필드들을 한글로 변환
 */
export function convertCustomerEnumsToKorean(customer: {
  gender: Gender | null;
  ageGroup: AgeGroup | null;
  region: Region | null;
}) {
  return {
    gender: genderToKorean(customer.gender),
    ageGroup: ageGroupToKorean(customer.ageGroup),
    region: regionToKorean(customer.region),
  };
}
