import express from 'express';

import userRouter from './users/users.routes';
import authRouter from './auth/auth.routes';
import companiesRouter from './companies/companies.routes';
import createCustomerRoutes from './customers/customers.routes';
import { dashboardRouter } from './dashboard/dashboard.routes';
import prisma from './common/prisma/client';
import carsRouter from './cars/cars.routes';
import createContractDocumentsRouter from './contract-documents/contract-documents.routes';

const router = express.Router();

router.use('/auth', authRouter(prisma));
router.use('/users', userRouter(prisma));
router.use('/companies', companiesRouter(prisma));
router.use('/customers', createCustomerRoutes(prisma));
router.use('/cars', carsRouter(prisma));
router.use('/dashboard', dashboardRouter(prisma));
router.use('/contractDocuments', createContractDocumentsRouter(prisma));

export default router;
