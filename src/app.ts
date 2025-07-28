import express from 'express';
import errorHandler from './middlewares/error.middleware';
import indexRouter from './index.routes';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', indexRouter);

// 에러 핸들링 미들웨어는 모든 라우트 뒤에 위치
app.use(errorHandler);

export default app;
