import { NextFunction, Request, Response } from 'express';
import CompanyService from './service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CompanyListQueryDto } from './dto/get-company.dto';

export default class CompanyController {
  static async registerCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const companyData: CreateCompanyDto = req.body;

      const registerCompany = await CompanyService.registerCompany(companyData);

      res.status(201).json(registerCompany);
    } catch (error) {
      next(error);
    }
  }

  static async getCompanyList(req: Request, res: Response, next: NextFunction) {
    try {
      const query: CompanyListQueryDto = req.body as unknown as CompanyListQueryDto;

      const companyList = await CompanyService.getCompanyList(query);
      res.status(200).json(companyList);
    } catch (error) {
      next(error);
    }
  }
}
