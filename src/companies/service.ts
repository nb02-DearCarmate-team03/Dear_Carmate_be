import { Prisma } from '@prisma/client';
import { CompanyOutputDto, CreateCompanyDto } from './dto/create-company.dto';
import {
  CompanyListQueryDto,
  CompanyListResponseDto,
  FindManyCompanyOptions,
} from './dto/get-companies.dto';
import CompanyRepository from './repository';
import {
  FindManyUserOptions,
  UserListQueryDto,
  UserListResponseDto,
  UserOutputDto,
} from './dto/get-users.dto';
import UpdateCompanyDto from './dto/update-companies.dto';

export default class CompanyService {
  static async registerCompany(data: CreateCompanyDto): Promise<CompanyOutputDto> {
    // companyName 중복 체크
    const existingCompanyName = await CompanyRepository.findByName(data.companyName);
    if (existingCompanyName) {
      throw new Error('이미 존재하는 기업명입니다.');
    }
    // companyCode 중복 체크
    const existingCompanyCode = await CompanyRepository.findByCode(data.companyCode);
    if (existingCompanyCode) {
      throw new Error('이미 존재하는 기업코드입니다.');
    }
    // 새로운 기업 등록
    const newCompany = await CompanyRepository.create({
      companyName: data.companyName,
      companyCode: data.companyCode,
    });

    return {
      id: newCompany.id,
      companyName: newCompany.companyName,
      companyCode: newCompany.companyCode,
      userCount: newCompany.userCount,
    };
  }

  static async getCompanyList(query: CompanyListQueryDto): Promise<CompanyListResponseDto> {
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

    const totalItemCount = await CompanyRepository.countCompanies(whereClause);
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

  static async getCompanyUsers(query: UserListQueryDto): Promise<UserListResponseDto> {
    const { page, pageSize } = query;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const whereClause: Prisma.UserWhereInput = {};
    if (query.searchBy && query.keyword) {
      if (query.searchBy === 'companyName') {
        whereClause.company = {
          companyName: {
            contains: query.keyword,
            mode: 'insensitive',
          },
        };
      } else if (query.searchBy === 'name') {
        whereClause.name = {
          contains: query.keyword,
          mode: 'insensitive',
        };
      } else if (query.searchBy === 'email') {
        whereClause.email = {
          contains: query.keyword,
          mode: 'insensitive',
        };
      }
    }

    const findOptions: FindManyUserOptions = {
      skip,
      take,
      where: whereClause,
      orderBy: { id: 'asc' },
    };

    const totalItemCount = await CompanyRepository.countUsers(whereClause);
    const users = await CompanyRepository.findManyUser(findOptions);

    const userOutputData: UserOutputDto[] = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      employeeNumber: user.employeeNumber,
      phoneNumber: user.phoneNumber,
      company: {
        companyName: user.company?.companyName || '',
      },
    }));

    const totalPages = Math.ceil(totalItemCount / pageSize);
    return {
      currentPage: page,
      totalPages,
      totalItemCount,
      data: userOutputData,
    };
  }

  static async updateCompany(companyId: number, data: UpdateCompanyDto): Promise<CompanyOutputDto> {
    const existingCompany = await CompanyRepository.findById(companyId);
    if (!existingCompany) {
      throw new Error('회사를 찾을 수 없습니다.');
    }

    // companyName 중복 체크
    if (data.companyName && data.companyName !== existingCompany.companyName) {
      const existingCompanyName = await CompanyRepository.findByName(data.companyName);
      if (existingCompanyName) {
        throw new Error('이미 존재하는 기업명입니다.');
      }
    }
    // companyCode 중복 체크
    if (data.companyCode && data.companyCode !== existingCompany.companyCode) {
      const existingCompanyCode = await CompanyRepository.findByCode(data.companyCode);
      if (existingCompanyCode) {
        throw new Error('이미 존재하는 기업코드입니다.');
      }
    }

    const updateData: Prisma.CompanyUpdateInput = {
      companyName: data.companyName,
      companyCode: data.companyCode,
    };

    // company 업데이트
    const updatedCompany = await CompanyRepository.updateCompany(companyId, updateData);

    return {
      id: updatedCompany.id,
      companyName: updatedCompany.companyName,
      companyCode: updatedCompany.companyCode,
      userCount: updatedCompany._count?.users || 0,
    };
  }

  static async deleteCompany(companyId: number): Promise<{ message: string }> {
    const existingCompany = await CompanyRepository.findById(companyId);
    if (!existingCompany) {
      throw new Error('회사를 찾을 수 없습니다.');
    }

    // 회사 삭제
    await CompanyRepository.deleteCompany(companyId);

    return { message: '회사 삭제 성공' };
  }
}
