import { IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class UploadCarDto {
  @IsNotEmpty({ message: 'CSV: 차량번호는 필수입니다.' })
  @IsString({ message: 'CSV: 차량번호는 문자열이어야 합니다.' })
  carNumber: string;

  @IsNotEmpty({ message: 'CSV: 제조사는 필수입니다.' })
  @IsString({ message: 'CSV: 제조사는 문자열이어야 합니다.' })
  manufacturer: string;

  @IsNotEmpty({ message: 'CSV: 모델명은 필수입니다.' })
  @IsString({ message: 'CSV: 모델명은 문자열이어야 합니다.' })
  model: string;

  @IsNotEmpty({ message: 'CSV: 차량 유형은 필수입니다.' })
  @IsString({ message: 'CSV: 차량 유형은 문자열이어야 합니다.' })
  @IsIn(['경·소형', '준중·중형', '대형', '스포츠카', 'SUV'], {
    message: 'CSV: 유효하지 않은 차량 유형입니다.',
  })
  type: '경·소형' | '준중·중형' | '대형' | '스포츠카' | 'SUV';

  @IsNotEmpty({ message: 'CSV: 연식은 필수입니다.' })
  @IsInt({ message: 'CSV: 연식은 정수여야 합니다.' })
  @Transform(({ value }) => parseInt(value, 10)) // CSV는 문자열이므로 숫자로 변환
  @Min(1900, { message: 'CSV: 연식은 1900년 이후여야 합니다.' })
  @Max(new Date().getFullYear(), {
    message: `CSV: 연식은 ${new Date().getFullYear()}년 이하이어야 합니다.`,
  })
  manufacturingYear: number;

  @IsNotEmpty({ message: 'CSV: 주행거리는 필수입니다.' })
  @IsNumber({}, { message: 'CSV: 주행거리는 숫자여야 합니다.' })
  @Transform(({ value }) => parseInt(value, 10)) // CSV는 문자열이므로 숫자로 변환
  mileage: number;

  @IsNotEmpty({ message: 'CSV: 가격은 필수입니다.' })
  @IsNumber({}, { message: 'CSV: 가격은 숫자여야 합니다.' })
  @Transform(({ value }) => parseFloat(value)) // CSV는 문자열이므로 숫자로 변환 (Decimal이므로 float로)
  price: number; // Decimal로 변환될 값

  @IsNotEmpty({ message: 'CSV: 사고횟수는 필수입니다.' })
  @IsInt({ message: 'CSV: 사고횟수는 정수여야 합니다.' })
  @Transform(({ value }) => (value ? parseInt(value, 10) : 0)) // CSV는 문자열이므로 숫자로 변환, 없으면 0
  accidentCount?: number;

  @IsOptional()
  @IsString({ message: 'CSV: 차량 설명은 문자열이어야 합니다.' })
  explanation?: string;

  @IsOptional()
  @IsString({ message: 'CSV: 사고 상세는 문자열이어야 합니다.' })
  accidentDetails?: string;
}
