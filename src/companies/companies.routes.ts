import express from 'express';
import CompanyController from './controller';

const router = express.Router();

router.post('/companies', CompanyController.registerCompany);

export default router;
