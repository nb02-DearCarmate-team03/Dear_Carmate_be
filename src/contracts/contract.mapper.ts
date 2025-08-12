/**
 * contract.mapper.ts (refactored)
 * - DB(Prisma) 결과 → API 응답 스펙으로 변환
 * - 아이템 필드 순서 보장:
 *   id → car → customer → user → meetings → contractPrice → resolutionDate → status
 */

import type { Prisma, ContractStatus as PrismaContractStatus } from '@prisma/client';

/* ---------- 응답 타입 ---------- */

export type ContractResponse = {
  id: number;
  car?: { id: number; model: string };
  customer?: { id: number; name: string };
  user?: { id: number; name: string };
  meetings: { date: string; alarms: string[] }[];
  contractPrice?: number;
  resolutionDate: string | null;
  status:
    | 'carInspection'
    | 'priceNegotiation'
    | 'contractDraft'
    | 'contractSuccessful'
    | 'contractFailed';
  // 👇 optional 로 두면 프론트 미사용 시에도 안전
  contractDocuments: { id: number; fileName: string }[];
};

/* ---------- Raw 타입 (Prisma Include 결과 최소 정의) ---------- */

type RawAlarm = { time: Date | string | null | undefined };
type RawMeeting = {
  date: Date | string | null | undefined;
  alarms?: RawAlarm[] | null | undefined;
};

export type RawContract = {
  id: number;
  car?: { id: number; model: string } | null;
  customer?: { id: number; name: string } | null;
  user?: { id: number; name: string } | null;
  meetings?: RawMeeting[] | null;
  contractPrice?: number | Prisma.Decimal | null;
  resolutionDate?: Date | string | null;
  status: PrismaContractStatus | string;
  contractDocuments?: { id: number; fileName: string }[] | null;
};

/* ---------- utils ---------- */

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

// ISO 문자열(UTC)로 안전 변환. 유효하지 않으면 null
export function toLocalDateTime(v?: Date | string | null): string | null {
  if (!v) return null;
  const d = new Date(v as any);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// YYYY-MM-DD 포맷으로 안전 변환. 유효하지 않으면 빈 문자열
export function toLocalDate(v?: Date | string | null): string {
  if (!v) return '';
  const d = new Date(v as any);
  if (Number.isNaN(d.getTime())) return '';
  const Y = d.getFullYear();
  const M = pad2(d.getMonth() + 1);
  const D = pad2(d.getDate());
  return `${Y}-${M}-${D}`;
}

// Prisma.Decimal | number | null/undefined → number | undefined
export function decimalToNumber(v: number | Prisma.Decimal | null | undefined): number | undefined {
  if (v == null) return undefined;
  if (typeof v === 'number') return v;
  // Decimal 객체이면 toNumber, 아니면 강제 변환
  const maybe = v as unknown as { toNumber?: () => number };
  return typeof maybe.toNumber === 'function' ? maybe.toNumber() : Number(v as any);
}

// DB 상태 → camelCase 키
const STATUS_KEY: Record<string, ContractResponse['status']> = {
  CAR_INSPECTION: 'carInspection',
  PRICE_NEGOTIATION: 'priceNegotiation',
  CONTRACT_DRAFT: 'contractDraft',
  CONTRACT_SUCCESSFUL: 'contractSuccessful',
  CONTRACT_FAILED: 'contractFailed',
};

export function toCamelStatus(s: string): ContractResponse['status'] {
  return (STATUS_KEY[s] ?? s) as ContractResponse['status'];
}

/* ---------- mappers ---------- */

function mapMeeting(m: RawMeeting): { date: string; alarms: string[] } {
  const date = toLocalDate(m?.date ?? null);
  const alarms = (m?.alarms ?? [])
    .map((a) => toLocalDateTime(a?.time ?? null))
    .filter((s): s is string => typeof s === 'string' && s.length > 0);
  return { date, alarms };
}

/**
 * 핵심 매퍼
 * - 필드 순서 엄격 고정
 * - undefined 반환한 키는 JSON 직렬화 시 빠짐
 */
export function mapContract(row: RawContract): ContractResponse {
  const response: ContractResponse = {
    id: row.id,
    car: row.car ? { id: row.car.id, model: row.car.model } : undefined,
    customer: row.customer ? { id: row.customer.id, name: row.customer.name } : undefined,
    user: row.user ? { id: row.user.id, name: row.user.name } : undefined,
    meetings: (row.meetings ?? []).map(mapMeeting),
    contractPrice: decimalToNumber(row.contractPrice),
    resolutionDate: toLocalDateTime(row.resolutionDate ?? null),
    status: toCamelStatus(String(row.status)),
    contractDocuments: (row.contractDocuments ?? []).map((d: { id: number; fileName: string }) => ({
      id: d.id,
      fileName: d.fileName,
    })),
  };

  return response; // 순서 유지
}
