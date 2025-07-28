import express from 'express';
import errorHandler from './middlewares/error.middleware';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// TODO: 여기에 라우터 연결 추가 예정
// 예: app.use('/api/users', userRouter);

app.use(errorHandler);

export default app;
