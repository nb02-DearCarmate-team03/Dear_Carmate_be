import express from 'express';

import userRouter from './users/users.routes';
import authRouter from './auth/auth.routes';
import companiesRouter from './companies/companies.routes';
import createCustomerRoutes from './customers/customers.routes';
import prisma from './common/prisma/client';

const router = express.Router();

router.use('/users', userRouter);
router.use('/companies', companiesRouter);
router.use('/auth', authRouter);
router.use('/customers', createCustomerRoutes(prisma));

export default router;
