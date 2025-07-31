/**
 * 계약 상태 열거형 (Prisma enum과 일치해야 함)
 */
export enum ContractStatus {
  CAR_INSPECTION = 'car_inspection',
  PRICE_NEGOTIATION = 'price_negotiation',
  CONTRACT_DRAFT = 'contractDraft',
  CONTRACT_SUCCESSFUL = 'contract_successful',
  CONTRACT_FAILED = 'contract_failed',
}
