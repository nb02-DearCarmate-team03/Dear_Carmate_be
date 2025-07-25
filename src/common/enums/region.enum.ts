/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * 고객이 거주하는 지역을 나타내는 열거형입니다.
 * - 프론트 지역 필터 및 통계 조회용으로 사용됩니다.
 */
export enum Region {
  SEOUL = 'seoul', // 서울
  GYEONGGI = 'gyeonggi', // 경기
  INCHEON = 'incheon', // 인천
  BUSAN = 'busan', // 부산
  DAEGU = 'daegu', // 대구
  DAEJEON = 'daejeon', // 대전
  GWANGJU = 'gwangju', // 광주
  ULSAN = 'ulsan', // 울산
  GANGWON = 'gangwon', // 강원
  CHUNGCHEONG = 'chungcheong', // 충청
  JEOLLA = 'jeolla', // 전라
  GYEONGSANG = 'gyeongsang', // 경상
  JEJU = 'jeju', // 제주
  ETC = 'etc', // 기타
}
export default Region;
