import { NextFunction, Request, Response } from 'express';
import { plainToInstance } from 'class-transformer';
import CompanyService from './service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CompanyListQueryDto } from './dto/get-companies.dto';
import { UserListQueryDto } from './dto/get-users.dto';
import UpdateCompanyDto from './dto/update-companies.dto';

export default class CompanyController {
  private readonly companyService: CompanyService;

  constructor(companyService: CompanyService) {
    this.companyService = companyService;
  }

  registerCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyData: CreateCompanyDto = req.body;

      const registerCompany = await this.companyService.registerCompany(companyData);

      res.status(201).json(registerCompany);
    } catch (error) {
      next(error);
    }
  };

  getCompanyList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = plainToInstance(CompanyListQueryDto, req.query);
      const companyList = await this.companyService.getCompanyList(query);
      res.status(200).json(companyList);
    } catch (error) {
      next(error);
    }
  };

  getUserList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = plainToInstance(UserListQueryDto, req.query);

      const userList = await this.companyService.getCompanyUsers(query);
      res.status(200).json(userList);
    } catch (error) {
      next(error);
    }
  };

  updateCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = Number(req.params.companyId);
      const data: UpdateCompanyDto = req.body;
      const updatedCompany = await this.companyService.updateCompany(companyId, data);

      res.status(200).json(updatedCompany);
    } catch (error) {
      next(error);
    }
  };

  deleteCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = Number(req.params.companyId);
      const result = await this.companyService.deleteCompany(companyId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
