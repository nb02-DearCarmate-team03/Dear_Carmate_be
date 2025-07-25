import express from 'express';

import companiesRouter from './companies/companies.routes';

const router = express.Router();

router.use('/companies', companiesRouter);

export default router;
