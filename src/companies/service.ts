import { Prisma } from '@prisma/client';
import { CompanyOutputDto, CreateCompanyDto } from './dto/create-company.dto';
import {
  CompanyListOutputDto,
  CompanyListQueryDto,
  FindManyCompanyOptions,
} from './dto/get-company.dto';
import CompanyRepository from './repository';

export default class CompanyService {
  static async registerCompany(companyData: CreateCompanyDto): Promise<CompanyOutputDto> {
    // companyName 중복 체크
    const existingCompanyName = await CompanyRepository.findByName(companyData.companyName);
    if (existingCompanyName) {
      throw new Error('이미 존재하는 기업명입니다.');
    }
    // companyCode 중복 체크
    const existingCompanyCode = await CompanyRepository.findByCode(companyData.companyCode);
    if (existingCompanyCode) {
      throw new Error('이미 존재하는 기업코드입니다.');
    }
    // 새로운 기업 등록
    const newCompany = await CompanyRepository.create({
      companyName: companyData.companyName,
      companyCode: companyData.companyCode,
    });

    return {
      id: newCompany.id,
      companyName: newCompany.companyName,
      companyCode: newCompany.companyCode,
      userCount: newCompany.userCount,
    };
  }

  static async getCompanyList(query: CompanyListQueryDto): Promise<CompanyListOutputDto> {
    const { page, pageSize } = query;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const whereClause: Prisma.CompanyWhereInput = {};
    if (query.searchBy === 'companyName' && query.keyword) {
      whereClause.companyName = {
        contains: query.keyword,
        mode: 'insensitive',
      };
    }

    const findOptions: FindManyCompanyOptions = {
      skip,
      take,
      where: whereClause,
      orderBy: { id: 'asc' },
    };

    const totalItemCount = await CompanyRepository.countAllCompanies(whereClause);
    const companies = await CompanyRepository.findManyCompany(findOptions);

    const companyOutputData: CompanyOutputDto[] = companies.map((company) => ({
      id: company.id,
      companyName: company.companyName,
      companyCode: company.companyCode,
      userCount: company._count?.users || 0,
    }));

    const totalPages = Math.ceil(totalItemCount / pageSize);

    return {
      currentPage: page,
      totalPages,
      totalItemCount,
      data: companyOutputData,
    };
  }
}
