import { Type } from 'class-transformer';
import { Prisma } from '@prisma/client';
import { IsIn, IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export type FindManyUserOptions = {
  skip?: number;
  take?: number;
  orderBy?: Prisma.UserOrderByWithRelationInput;
  where?: Prisma.UserWhereInput;
};

export class UserListQueryDto {
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
  @IsIn(['companyName', 'name', 'email'], {
    message: ' 검색은 기업명, 이름, 이메일 중 하나여야 합니다. ',
  })
  searchBy?: 'companyName' | 'name' | 'email';

  @IsOptional()
  @IsString({ message: '검색어는 문자열이어야 합니다.' })
  @Length(1, 100, { message: '검색어는 1자 이상 100자 이하여야 합니다.' })
  keyword?: string;
}

export interface UserCompanyOutputDto {
  companyName: string;
}

export interface UserOutputDto {
  id: number;
  name: string;
  email: string;
  employeeNumber: string;
  phoneNumber: string;
  company: UserCompanyOutputDto;
}

export interface UserListResponseDto {
  currentPage: number;
  totalPages: number;
  totalItemCount: number;
  data: UserOutputDto[];
}
