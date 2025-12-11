import { PrismaClient } from '@prisma/client';
import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

import errorHandler from './middlewares/error.middleware';
import passport from './auth/passport';
import swaggerOptions from '../swagger-options';

import indexRouter from './index.routes';

const app = express();
const prisma = new PrismaClient();

const specs = swaggerJsdoc(swaggerOptions);

app.get('/', (req, res) => {
  // 200 OK 상태 코드와 함께 JSON 응답을 보냅니다.
  res.status(200).json({
    status: 'OK',
    service: 'Dear Carmate Backend Service',
    message: 'Server is running successfully.',
  });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use(morgan('dev'));
app.use(cors());

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(passport.initialize());

app.use('/', indexRouter);

app.use(errorHandler);

export default app;
