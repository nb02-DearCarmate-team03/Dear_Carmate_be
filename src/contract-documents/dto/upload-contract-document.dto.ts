import { IsInt, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export default class UploadContractDocumentDto {
  @IsOptional() // ✅ 필수 → 선택
  @Type(() => Number)
  @IsInt({ message: '계약 ID는 정수여야 합니다.' })
  @Min(1, { message: '계약 ID는 1 이상이어야 합니다.' })
  contractId?: number;

  // 멀터/프런트가 남길 수 있는 키들: 검증에서 허용(무시)
  @IsOptional() files?: unknown;
  @IsOptional() file?: unknown;
  @IsOptional() documents?: unknown;
  @IsOptional() ['files[]']?: unknown;
  @IsOptional() ['file[]']?: unknown;
  @IsOptional() ['documents[]']?: unknown;
}
