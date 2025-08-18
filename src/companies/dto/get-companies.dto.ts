import { Type } from 'class-transformer';
import { Prisma } from '@prisma/client';
import { IsIn, IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { CompanyOutputDto } from './create-company.dto';

export type FindManyCompanyOptions = {
  skip: number;
  take: number;
  orderBy?: Prisma.CompanyOrderByWithRelationInput;
  where?: Prisma.CompanyWhereInput;
};

export class CompanyListQueryDto {
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
  @IsString({ message: '검색 기준은 문자열이어야 합니다.' })
  @IsIn(['companyName'], { message: ' 검색 기준은 기업명만 가능합니다.' })
  searchBy?: 'companyName';

  @IsOptional()
  @IsString({ message: '검색어는 문자열이어야 합니다.' })
  @Length(1, 20, { message: '검색어는 1자 이상 20자 이하여야 합니다.' })
  keyword?: string;
}

export interface CompanyListResponseDto {
  currentPage: number;
  totalPages: number;
  totalItemCount: number;
  data: CompanyOutputDto[];
}
