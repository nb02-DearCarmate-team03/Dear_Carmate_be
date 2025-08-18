import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateCompanyDto {
  @IsNotEmpty({ message: '회사명은 필수 입력 항목입니다.' })
  @IsString({ message: '회사명은 문자열이어야 합니다.' })
  @Length(1, 100, { message: '회사명은 1자 이상 100자 이하여야 합니다.' })
  companyName: string;

  @IsNotEmpty({ message: '회사코드는 필수 입력 항목입니다.' })
  @IsString({ message: '회사코드는 문자열이어야 합니다.' })
  @Length(1, 50, { message: '회사코드는 6자 이상 50자 이하여야 합니다. ' })
  companyCode: string;
}

export interface CompanyOutputDto {
  id: number;
  companyName: string;
  companyCode: string;
  userCount: number;
}
