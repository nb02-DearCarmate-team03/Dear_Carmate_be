// src/utils/customer.converter.ts
import { Gender, AgeGroup, Region } from '@prisma/client';

/**
 * Gender enum을 한글로 변환
 */
export function genderToKorean(gender: Gender | null): string | null {
  if (!gender) return null;

  // Prisma enum을 한글로 변환
  const genderMap: Record<string, string> = {
    MALE: 'male', // ✅ 수정
    FEMALE: 'female', // ✅ 수정
    male: 'male', // 혹시 모를 소문자 케이스
    female: 'female',
  };

  return genderMap[gender as string] || '남성'; // 기본값 설정
}

/**
 * AgeGroup enum을 한글로 변환
 */
export function ageGroupToKorean(ageGroup: AgeGroup | null): string | null {
  if (!ageGroup) return null;

  const ageGroupMap: Record<string, string> = {
    TEENAGER: '10대',
    TWENTIES: '20대',
    THIRTIES: '30대',
    FORTIES: '40대',
    FIFTIES: '50대',
    SIXTIES: '60대',
    SEVENTIES: '70대',
    EIGHTIES: '80대',
  };

  return ageGroupMap[ageGroup as string] || null;
}

/**
 * Region enum을 한글로 변환
 */
export function regionToKorean(region: Region | null): string | null {
  if (!region) return null;

  const regionMap: Record<string, string> = {
    SEOUL: '서울',
    GYEONGGI: '경기',
    INCHEON: '인천',
    GANGWON: '강원',
    CHUNGBUK: '충북',
    CHUNGNAM: '충남',
    SEJONG: '세종',
    DAEJEON: '대전',
    JEONBUK: '전북',
    JEONNAM: '전남',
    GWANGJU: '광주',
    GYEONGBUK: '경북',
    GYEONGNAM: '경남',
    DAEGU: '대구',
    ULSAN: '울산',
    BUSAN: '부산',
    JEJU: '제주',
  };

  return regionMap[region as string] || null;
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
