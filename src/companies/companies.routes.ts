import express from 'express';
import CompanyController from './controller';
import validateDto from '../common/utils/validate.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CompanyListQueryDto } from './dto/get-company.dto';

const router = express.Router();

router.post('/', validateDto(CreateCompanyDto), CompanyController.registerCompany);
router.get('/', validateDto(CompanyListQueryDto), CompanyController.getCompanyList);

export default router;
