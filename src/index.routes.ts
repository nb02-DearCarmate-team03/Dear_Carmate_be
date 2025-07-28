import express from 'express';

import userRouter from './users/users.routes';
import authRouter from './auth/auth.routes';
import companiesRouter from './companies/companies.routes';

const router = express.Router();

router.use('/users', userRouter);
router.use('/companies', companiesRouter);
router.use('/auth', authRouter);

export default router;
