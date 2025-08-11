/**
 * contract.mapper
 *
 * - 상태/날짜/숫자 포맷 변환 유틸
 * - DB → API Spec, API Payload Normalization
 * - 문서 기능과 무관 (업로드/메타데이터 없음)
 */
import type { ContractStatus } from '@prisma/client';

function toDateOnly(value?: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}
function toDateTime(value?: Date | null): string | null {
  return value ? value.toISOString().slice(0, 19) : null;
}
function toNumberOrNull(value: unknown): number | null {
  if (value == null) return null;
  const parsed = Number(value as never);
  return Number.isFinite(parsed) ? parsed : null;
}

/* 출력용 상태 매핑 */
const STATUS_MAP: Record<string, string> = {
  CAR_INSPECTION: 'carInspection',
  PRICE_NEGOTIATION: 'priceNegotiation',
  CONTRACT_DRAFT: 'contractDraft',
  CONTRACT_SUCCESSFUL: 'contractSuccessful',
  CONTRACT_FAILED: 'contractFailed',
};
function mapStatus(value: ContractStatus | string): string {
  const key = String(value);
  return STATUS_MAP[key] ?? key;
}

/* 입력 정규화: 라벨/예시문구 → 서버 enum */
const STATUS_REVERSE_MAP: Record<string, ContractStatus> = {
  carInspection: 'CAR_INSPECTION',
  priceNegotiation: 'PRICE_NEGOTIATION',
  contractDraft: 'CONTRACT_DRAFT',
  contractSuccessful: 'CONTRACT_SUCCESSFUL',
  contractFailed: 'CONTRACT_FAILED',
  CAR_INSPECTION: 'CAR_INSPECTION',
  PRICE_NEGOTIATION: 'PRICE_NEGOTIATION',
  CONTRACT_DRAFT: 'CONTRACT_DRAFT',
  CONTRACT_SUCCESSFUL: 'CONTRACT_SUCCESSFUL',
  CONTRACT_FAILED: 'CONTRACT_FAILED',
};

export function toServerContractStatus(value?: unknown): ContractStatus | undefined {
  if (value == null) return undefined;
  const raw = String(value).trim();
  const [head] = raw.split('|', 1);
  const token = (head ?? raw).trim();
  return STATUS_REVERSE_MAP[token];
}

export type UpdatePayloadNormalized = {
  status?: ContractStatus;
  resolutionDate?: string | null;
  contractPrice?: number | null;
  meetings?: Array<{ date: string; alarms?: string[] }>;
};
export function normalizeUpdatePayload(input: unknown): UpdatePayloadNormalized {
  const src = (input ?? {}) as Record<string, unknown>;
  const out: UpdatePayloadNormalized = {};

  const status = toServerContractStatus(src.status);
  if (status) out.status = status;

  if ('resolutionDate' in src)
    out.resolutionDate = (src.resolutionDate as string | null | undefined) ?? null;
  if ('contractPrice' in src)
    out.contractPrice = (src.contractPrice as number | null | undefined) ?? null;

  if (Array.isArray(src.meetings)) {
    out.meetings = (src.meetings as Array<{ date: string; alarms?: string[] }>).map((m) => ({
      date: m.date,
      alarms: Array.isArray(m.alarms) && m.alarms.length ? m.alarms : undefined,
    }));
  }
  return out;
}

/* 리스트/상세 출력 변환 */
export type ContractRowLike = {
  id: number;
  status: ContractStatus | string;
  resolutionDate: Date | null;
  contractPrice: unknown | null;
  user?: { id: number; name: string } | null;
  customer?: { id: number; name: string } | null;
  car?: { id: number; model: string } | null;
  meetings?: { date: Date; alarms?: { time: Date }[] }[];
};

type SpecMeeting = { date: string; alarms: string[] };
type SpecUserWrap = { user: { id: number; name: string } };
type SpecCustomerWrap = { customer: { id: number; name: string } };
type SpecCarWrap = { car: { id: number; model: string } };
type SpecMeetingItem = SpecMeeting | SpecUserWrap | SpecCustomerWrap | SpecCarWrap;

export type ContractSpec = {
  id: number;
  status: string;
  resolutionDate: string | null;
  contractPrice: number | null;
  meetings: SpecMeetingItem[];
};

export function mapContractToSpec(row: ContractRowLike): ContractSpec {
  const meetingItems: SpecMeetingItem[] = [];
  const meetingRows = Array.isArray(row.meetings) ? row.meetings : [];

  for (let i = 0; i < meetingRows.length; i += 1) {
    const meeting = meetingRows[i];
    if (meeting) {
      const alarmRows = Array.isArray(meeting.alarms) ? meeting.alarms : [];
      const alarms: string[] = [];
      for (let j = 0; j < alarmRows.length; j += 1) {
        const alarm = alarmRows[j];
        if (alarm) {
          const time = toDateTime(alarm.time);
          if (time) alarms.push(time);
        }
      }
      meetingItems.push({ date: toDateOnly(meeting.date) ?? '', alarms });
    }
  }

  if (row.user) meetingItems.push({ user: { id: row.user.id, name: row.user.name } });
  if (row.customer)
    meetingItems.push({ customer: { id: row.customer.id, name: row.customer.name } });
  if (row.car) meetingItems.push({ car: { id: row.car.id, model: row.car.model } });

  return {
    id: row.id,
    status: mapStatus(row.status),
    resolutionDate: toDateTime(row.resolutionDate),
    contractPrice: toNumberOrNull(row.contractPrice),
    meetings: meetingItems,
  };
}
