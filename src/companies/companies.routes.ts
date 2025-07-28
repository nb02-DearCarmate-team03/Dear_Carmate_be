import express from 'express';
import CompanyController from './controller';
import validateDto from '../common/utils/validate.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CompanyListQueryDto } from './dto/get-companies.dto';
import { UserListQueryDto } from './dto/get-users.dto';
import UpdateCompanyDto from './dto/update-companies.dto';

const router = express.Router();

router.post('/', validateDto(CreateCompanyDto), CompanyController.registerCompany);
router.get('/', validateDto(CompanyListQueryDto), CompanyController.getCompanyList);
router.get('/users', validateDto(UserListQueryDto), CompanyController.getUserList);
router.patch('/:companyId', validateDto(UpdateCompanyDto), CompanyController.updateCompany);
router.delete('/:companyId', CompanyController.deleteCompany);

export default router;
