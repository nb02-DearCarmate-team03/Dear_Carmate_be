import { IsOptional, IsString, Length } from 'class-validator';

export default class UpdateCompanyDto {
  @IsOptional()
  @IsString({ message: '회사명은 문자열이어야 합니다.' })
  @Length(1, 100, { message: '회사명은 1자 이상 100자 이하여야 합니다.' })
  companyName?: string;

  @IsOptional()
  @IsString({ message: '회사코드는 문자열이어야 합니다.' })
  @Length(1, 50, { message: '회사코드는 1자 이상 50자 이하여야 합니다. ' })
  companyCode?: string;
}
