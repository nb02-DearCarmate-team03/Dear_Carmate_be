import express from 'express';

import userRouter from './users/users.routes';
import authRouter from './auth/auth.routes';
import companiesRouter from './companies/companies.routes';
import createCustomerRoutes from './customers/customers.routes';
import { dashboardRouter } from './dashboard/dashboard.routes';
import prisma from './common/prisma/client';
import CarsRouter from './cars/cars.routes';

const router = express.Router();

router.use('/companies', companiesRouter);
router.use('/users', userRouter);
router.use('/companies', companiesRouter(prisma));
router.use('/auth', authRouter);
router.use('/customers', createCustomerRoutes(prisma));
router.use('/cars', CarsRouter(prisma));
router.use('/dashboard', dashboardRouter(prisma));

export default router;
