import { IsArray, IsInt, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export default class DownloadContractDocumentsDto {
  @IsArray({ message: '계약서 ID 배열이어야 합니다.' })
  @ArrayMinSize(1, { message: '최소 1개 이상의 계약서를 선택해주세요.' })
  @Type(() => Number)
  @IsInt({ each: true, message: '계약서 ID는 정수여야 합니다.' })
  contractDocumentIds!: number[];
}
