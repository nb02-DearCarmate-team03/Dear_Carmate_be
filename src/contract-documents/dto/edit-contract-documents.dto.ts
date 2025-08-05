import { IsArray, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export default class EditContractDocumentsDto {
  @IsOptional()
  @IsArray({ message: '삭제할 문서 ID는 배열이어야 합니다.' })
  @Type(() => Number)
  @IsInt({ each: true, message: '문서 ID는 정수여야 합니다.' })
  deleteDocumentIds?: number[];
}
