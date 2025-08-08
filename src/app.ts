import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import errorHandler from './middlewares/error.middleware';
import passport from './auth/passport';

import indexRouter from './index.routes';

const app = express();

app.use(morgan('dev'));
app.use(cors());

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(passport.initialize());

app.use('/', indexRouter);

// 에러 핸들링 미들웨어는 모든 라우트 뒤에 위치
app.use(errorHandler);

export default app;
