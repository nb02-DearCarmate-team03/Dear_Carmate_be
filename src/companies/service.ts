import { Prisma } from '@prisma/client';
import { ConflictError, NotFoundError } from '../middlewares/error.middleware';
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
  private readonly companyRepository: CompanyRepository;

  constructor(companyRepository: CompanyRepository) {
    this.companyRepository = companyRepository;
  }

  async registerCompany(data: CreateCompanyDto): Promise<CompanyOutputDto> {
    // companyName 중복 체크
    const existingCompanyName = await this.companyRepository.findByName(data.companyName);
    if (existingCompanyName) {
      throw new ConflictError('이미 존재하는 기업명입니다.');
    }
    // companyCode 중복 체크
    const existingCompanyCode = await this.companyRepository.findByCode(data.companyCode);
    if (existingCompanyCode) {
      throw new ConflictError('이미 존재하는 기업코드입니다.');
    }
    // 새로운 기업 등록
    const newCompany = await this.companyRepository.create({
      companyName: data.companyName,
      companyCode: data.companyCode,
    });

    return {
      id: newCompany.id,
      companyName: newCompany.companyName,
      companyCode: newCompany.companyCode,
      userCount: newCompany._count?.users || 0,
    };
  }

  async getCompanyList(query: CompanyListQueryDto): Promise<CompanyListResponseDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 8;
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

    const totalItemCount = await this.companyRepository.countCompanies(whereClause);
    const companies = await this.companyRepository.findManyCompany(findOptions);

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

  async getCompanyUsers(query: UserListQueryDto): Promise<UserListResponseDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 8;
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

    const totalItemCount = await this.companyRepository.countUsers(whereClause);
    const users = await this.companyRepository.findManyUser(findOptions);

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

  async updateCompany(companyId: number, data: UpdateCompanyDto): Promise<CompanyOutputDto> {
    const existingCompany = await this.companyRepository.findById(companyId);
    if (!existingCompany) {
      throw new NotFoundError('존재하지 않는 회사입니다');
    }

    // companyName 중복 체크
    if (data.companyName && data.companyName !== existingCompany.companyName) {
      const existingCompanyName = await this.companyRepository.findByName(data.companyName);
      if (existingCompanyName) {
        throw new ConflictError('이미 존재하는 기업명입니다.');
      }
    }
    // companyCode 중복 체크
    if (data.companyCode && data.companyCode !== existingCompany.companyCode) {
      const existingCompanyCode = await this.companyRepository.findByCode(data.companyCode);
      if (existingCompanyCode) {
        throw new ConflictError('이미 존재하는 기업코드입니다.');
      }
    }

    const updateData: Prisma.CompanyUpdateInput = {};
    if (data.companyName) updateData.companyName = data.companyName;
    if (data.companyCode) updateData.companyCode = data.companyCode;

    // company 업데이트
    const updatedCompany = await this.companyRepository.updateCompany(companyId, updateData);

    return {
      id: updatedCompany.id,
      companyName: updatedCompany.companyName,
      companyCode: updatedCompany.companyCode,
      userCount: updatedCompany._count?.users || 0,
    };
  }

  async deleteCompany(companyId: number): Promise<{ message: string }> {
    const existingCompany = await this.companyRepository.findById(companyId);
    if (!existingCompany) {
      throw new NotFoundError('존재하지 않는 회사입니다');
    }

    // 회사 삭제
    await this.companyRepository.deleteCompany(companyId);

    return { message: '회사 삭제 성공' };
  }
}
