import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateContractDocumentDto {
  @IsInt()
  id!: number;

  @IsOptional()
  @IsString()
  fileName?: string;
}
