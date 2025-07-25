import express from 'express';

const router = express.Router();

router.post('/companies', CompanyController.registerCompany);

export default router;
