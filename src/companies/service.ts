import { CompanyOutputDto, CreateCompanyDto } from './dto/company.dto';
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
}