import { NextFunction, Request, Response } from 'express';
import CompanyService from './service';
import { CreateCompanyDto } from './dto/company.dto';

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
}
