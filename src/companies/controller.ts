import { NextFunction, Request, Response } from 'express';
import CompanyService from './service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CompanyListQueryDto } from './dto/get-companies.dto';
import { UserListQueryDto } from './dto/get-users.dto';
import UpdateCompanyDto from './dto/update-companies.dto';

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
      const query: CompanyListQueryDto = req.query as unknown as CompanyListQueryDto;

      const companyList = await CompanyService.getCompanyList(query);
      res.status(200).json(companyList);
    } catch (error) {
      next(error);
    }
  }

  static async getUserList(req: Request, res: Response, next: NextFunction) {
    try {
      const query: UserListQueryDto = req.query as unknown as UserListQueryDto;

      const userList = await CompanyService.getCompanyUsers(query);
      res.status(200).json(userList);
    } catch (error) {
      next(error);
    }
  }

  static async updateCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = Number(req.params.companyId);
      const data: UpdateCompanyDto = req.body;
      const updatedCompany = await CompanyService.updateCompany(companyId, data);

      res.status(200).json(updatedCompany);
    } catch (error) {
      next(error);
    }
  }

  static async deleteCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = Number(req.params.companyId);
      await CompanyService.deleteCompany(companyId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
