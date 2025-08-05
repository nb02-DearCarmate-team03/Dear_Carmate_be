import { IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export default class UploadContractDocumentDto {
  @IsNotEmpty({ message: '계약 ID는 필수입니다.' })
  @Type(() => Number)
  @IsInt({ message: '계약 ID는 정수여야 합니다.' })
  contractId!: number;
}
