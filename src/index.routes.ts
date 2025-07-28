import express from 'express';

import companiesRouter from './companies/companies.routes';
import createCustomerRoutes from './customers/customers.routes';
import prisma from './common/prisma/client';

const router = express.Router();

router.use('/companies', companiesRouter);
router.use('/customers', createCustomerRoutes(prisma));

export default router;
