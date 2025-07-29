import express from 'express';
import createCustomerRoutes from './customers/customers.routes';
import prisma from './common/prisma/client';
import CompaniesRouter from './companies/companies.routes';
import CarsRouter from './cars/cars.routes';

const router = express.Router();

router.use('/companies', CompaniesRouter);
router.use('/customers', createCustomerRoutes(prisma));
router.use('/cars', CarsRouter);

export default router;
