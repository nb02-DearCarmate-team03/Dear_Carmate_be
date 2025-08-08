import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import isAuthenticated from '../middlewares/passport.middlewares';
import CompanyController from './controller';
import validateDto from '../common/utils/validate.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CompanyListQueryDto } from './dto/get-companies.dto';
import { UserListQueryDto } from './dto/get-users.dto';
import UpdateCompanyDto from './dto/update-companies.dto';
import { authorizeAdmin } from '../middlewares/auth.middleware';
import CompanyRepository from './repository';
import CompanyService from './service';

const CompaniesRouter = (prisma: PrismaClient): Router => {
  const router = Router();

  const companyRepository = new CompanyRepository(prisma);
  const companyService = new CompanyService(companyRepository);
  const companyController = new CompanyController(companyService);

  router.use(isAuthenticated);
  router.use(authorizeAdmin);
  router.post('/', validateDto(CreateCompanyDto), companyController.registerCompany);
  router.get('/', validateDto(CompanyListQueryDto), companyController.getCompanyList);
  router.get('/users', validateDto(UserListQueryDto), companyController.getUserList);
  router.patch('/:companyId', validateDto(UpdateCompanyDto), companyController.updateCompany);
  router.delete('/:companyId', companyController.deleteCompany);

  return router;
};

export default CompaniesRouter;
