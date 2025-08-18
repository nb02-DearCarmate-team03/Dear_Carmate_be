import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { CarType } from '../../common/enums/car-type.enum';

export class SalesByCarTypeDto {
  @IsEnum(CarType)
  carType: CarType;

  // 한글 라벨 사용 중이면 그대로 유지
  carTypeLabel: CarType;

  // 원(₩) 단위 총액
  @IsNumber()
  amount: number;

  // ✅ 프런트 호환용: 일부 컴포넌트가 revenue를 dataKey로 사용
  @IsNumber()
  @IsOptional()
  revenue?: number;

  // ✅ 프런트 현재 구현(Chart.js)이 sales에서도 `count`를 읽음 → 같이 내려줌
  //   단위는 amount와 동일(원). 프런트 옵션에서 만원 표시 포맷팅.
  @IsNumber()
  @IsOptional()
  count?: number;
}
