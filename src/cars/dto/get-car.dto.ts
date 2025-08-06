import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { CarStatus, Prisma } from '@prisma/client';
import { CarResponseDto } from './create-car.dto';

export class CarListQueryDto {
  @Type(() => Number)
  @IsNumber({}, { message: '페이지는 숫자여야 합니다.' })
  @Min(1, { message: '페이지는 1 이상이어야 합니다.' })
  page: number = 1;

  @Type(() => Number)
  @IsNumber({}, { message: '페이지당 항목 수는 숫자여야 합니다.' })
  @Min(1, { message: '페이지당 항목 수는 1 이상이어야 합니다.' })
  @Max(8, { message: '페이지당 항목 수는 8을 초과할 수 없습니다.' })
  pageSize: number = 8;

  @IsOptional()
  @IsString({ message: '상태는 문자열이어야 합니다.' })
  @IsIn([CarStatus.POSSESSION, CarStatus.CONTRACT_PROCEEDING, CarStatus.CONTRACT_COMPLETED], {
    message: '보유중, 계약 진행중, 계약 완료 중 하나여야 합니다.',
  })
  status?: CarStatus;

  @IsOptional()
  @IsString({ message: '검색 기준은 문자열이어야 합니다.' })
  @IsIn(['carNumber', 'model'], { message: ' 검색은 차량번호, 차량모델만 가능합니다.' })
  searchBy?: 'carNumber' | 'model';

  @IsOptional()
  @IsString({ message: '검색어는 문자열이어야 합니다.' })
  @Length(1, 100, { message: '검색어는 1자 이상 100자 이하여야 합니다.' })
  keyword?: string;
}

export type FindManyCarOptions = {
  skip: number;
  take: number;
  orderBy?: Prisma.CarOrderByWithRelationInput;
  where?: Prisma.CarWhereInput;
};

export interface CarListResponseDto {
  currentPage: number;
  totalPages: number;
  totalItemCount: number;
  data: CarResponseDto[];
}
