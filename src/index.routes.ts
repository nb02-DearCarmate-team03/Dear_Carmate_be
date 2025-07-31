import express from 'express';

import userRouter from './users/users.routes';
import authRouter from './auth/auth.routes';
import companiesRouter from './companies/companies.routes';
import createCustomerRoutes from './customers/customers.routes';
import { dashboardRouter } from './dashboard/dashboard.routes';
import prisma from './common/prisma/client';

const router = express.Router();

router.use('/users', userRouter);
router.use('/companies', companiesRouter);
router.use('/auth', authRouter);
router.use('/customers', createCustomerRoutes(prisma));
router.use('/dashboard', dashboardRouter(prisma));

export default router;
