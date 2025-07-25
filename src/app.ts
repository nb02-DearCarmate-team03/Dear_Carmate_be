import express from 'express';
import { PrismaClient } from '@prisma/client';
import createCustomerRoutes from './customers/customers.routes';
import { errorHandler } from './middlewares/error.middleware';
import indexRouter from './index.routes';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use('/', indexRouter);

// Customer 라우트 등록
app.use('/customers', createCustomerRoutes(prisma));

// 에러 핸들링 미들웨어는 모든 라우트 뒤에 위치
app.use(errorHandler);

export default app;
