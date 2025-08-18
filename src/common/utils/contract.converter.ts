import { Transform } from 'class-transformer';

/** 내부 유틸리티: 식별자 정규화 */
function normalizeIdentifier(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  if (typeof value === 'object') {
    const candidate = (value as any)?.id ?? (value as any)?.value;
    return candidate === null || candidate === undefined || candidate === ''
      ? undefined
      : Number(candidate);
  }
  const numeric = Number(value as any);
  return Number.isFinite(numeric) ? numeric : undefined;
}

/** 내부 유틸리티: 통화 금액 정규화 */
function normalizeCurrencyAmount(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value === 'number') return value;
  const numeric = Number(String(value).replace(/[^\d.-]/g, '')); // 예: "1,000,000원" → 1000000
  return Number.isFinite(numeric) ? numeric : undefined;
}

/** 내부 유틸리티: 한국 표준시 기준의 날짜‧시간 문자열로 변환 */
function toKoreaStandardTimeDateTimeString(value: unknown): string | undefined {
  if (value === null || value === undefined || value === '') return undefined;

  // Date 인스턴스인 경우
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const isoWithoutZ = value.toISOString().replace('Z', '');
    return `${isoWithoutZ}+09:00`;
  }

  if (typeof value !== 'string') return undefined;

  let s = value.trim();
  if (!s) return undefined;

  // 1) 슬래시를 하이픈으로 통일
  s = s.replace(/\//g, '-');

  // 2) 'YYYY-MM-DD HH:mm' | 'YYYY-MM-DD HH:mm:ss' → 'YYYY-MM-DDTHH:mm(:ss)'
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(?::\d{2})?$/.test(s) && !s.includes('T')) {
    s = s.replace(/\s+/, 'T');
  }

  // 3) 초가 없으면 추가
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) {
    s = `${s}:00`;
  }

  // 4) 시차 정보가 없으면 한국 표준시(+09:00) 부여
  if (!/(?:[zZ]|[+-]\d{2}:\d{2})$/.test(s)) {
    s = `${s}+09:00`;
  }

  // 간단 유효성 검사
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return undefined;
  return s;
}

/** 식별자(숫자)로 변환 */
export function ToIdentifier() {
  return Transform(({ value }) => normalizeIdentifier(value), { toClassOnly: true });
}

/** 통화 금액(숫자)으로 변환 */
export function ToCurrencyAmount() {
  return Transform(({ value }) => normalizeCurrencyAmount(value), { toClassOnly: true });
}

/** 한국 표준시 기준 날짜‧시간 문자열로 변환 */
export function ToKoreaStandardTimeDateTime() {
  return Transform(
    ({ value }) => {
      if (Array.isArray(value)) {
        return value
          .map(toKoreaStandardTimeDateTimeString)
          .filter((v): v is string => typeof v === 'string' && v.length > 0);
      }
      return toKoreaStandardTimeDateTimeString(value);
    },
    { toClassOnly: true },
  );
}
