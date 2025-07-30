import { Router } from 'express';
import CompanyController from './controller';
import validateDto from '../common/utils/validate.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CompanyListQueryDto } from './dto/get-companies.dto';
import { UserListQueryDto } from './dto/get-users.dto';
import UpdateCompanyDto from './dto/update-companies.dto';
import { authenticateJWT, authorizeAdmin } from '../middlewares/auth.middleware';

const CompaniesRouter = (companyController: CompanyController): Router => {
  const router = Router();

  router.use(authenticateJWT);
  router.use(authorizeAdmin);
  router.post('/', validateDto(CreateCompanyDto), companyController.registerCompany);
  router.get('/', validateDto(CompanyListQueryDto), companyController.getCompanyList);
  router.get('/users', validateDto(UserListQueryDto), companyController.getUserList);
  router.patch('/:companyId', validateDto(UpdateCompanyDto), companyController.updateCompany);
  router.delete('/:companyId', companyController.deleteCompany);

  return router;
};

export default CompaniesRouter;
