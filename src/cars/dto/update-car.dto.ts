import { IsInt, IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class UpdateCarDto {
  @IsOptional()
  @IsString({ message: '차량번호는 문자열이어야 합니다.' })
  @Length(1, 20, { message: '차량번호는 1자 이상 20자 이하이어야 합니다.' })
  carNumber?: string;

  @IsOptional()
  @IsString({ message: '제조사는 문자열이어야 합니다.' })
  @Length(1, 50, { message: '제조사는 1자 이상 50자 이하이어야 합니다.' })
  manufacturer?: string;

  @IsOptional()
  @IsString({ message: '모델명은 문자열이어야 합니다.' })
  @Length(1, 100, { message: '모델명은 1자 이상 100자 이하이어야 합니다.' })
  model?: string;

  @IsOptional()
  @IsString({ message: '차량 유형은 문자열이어야 합니다.' })
  type?: '경·소형' | '준중·중형' | '대형' | 'SUV' | '스포츠카';

  @IsOptional()
  @IsInt({ message: '연식은 숫자여야 합니다.' })
  @Min(1900, { message: '연식은 1900년 이후여야 합니다.' })
  @Max(new Date().getFullYear(), {
    message: `연식은 ${new Date().getFullYear()}년 이하이어야 합니다.`,
  })
  manufacturingYear?: number;

  @IsOptional()
  @IsNumber({}, { message: '주행거리는 숫자여야 합니다.' })
  mileage?: number;

  @IsOptional()
  @IsNumber({}, { message: '가격은 숫자여야 합니다.' })
  price?: number;

  @IsOptional()
  @IsInt({ message: '사고횟수는 숫자여야 합니다.' })
  accidentCount?: number;

  @IsOptional()
  @IsString({ message: '차량 설명은 문자열이어야 합니다.' })
  explanation?: string;

  @IsOptional()
  @IsString({ message: '사고 상세는 문자열이어야 합니다.' })
  accidentDetails?: string;
}
